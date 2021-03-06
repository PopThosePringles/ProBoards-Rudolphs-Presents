class Rudolphs_Presents_Button {

	constructor(){
		this.selected = null;
		this.item_dialog = null;
		this.create_button();
	}

	create_button(){
		let $button = $("<a class='button' id='rudolphs-presents-button' href='#' role='button'>" + Rudolphs_Presents.get_text("profile_button") + "</a>");
		let $conversation_button = $(".controls a.button[href^='/conversation/new/']");

		if($conversation_button.length){
			$button.insertBefore($conversation_button);
		}

		// Look for button as it may have manually been added to template

		$("#rudolphs-presents-button").on("click", this.show_item_dialog.bind(this));
	}

	show_item_dialog(){

		// Does the user have enough tokens to send a present?

		let tokens = Rudolphs_Presents.api.get(yootil.user.id()).tokens();

		if(tokens <= 0 && !Rudolphs_Presents.api.get(yootil.user.id()).unlimited()){
			new Rudolphs_Presents_Info_Dialog({

				title: Rudolphs_Presents.get_text("dialog_title") + " - No " + Rudolphs_Presents.get_text("token") + "s",
				msg: "You currently have no more " + Rudolphs_Presents.get_text("token", true) + "s, however, you have a chance to earn more when you post.",
				width: 350,
				height: 150

			});

			return false;
		}

		// Has a present already been sent max allowed presents to this user?

		if(Rudolphs_Presents.api.present(yootil.page.member.id()).has_received_max_from(yootil.user.id())){
			new Rudolphs_Presents_Info_Dialog({

				title: Rudolphs_Presents.get_text("dialog_title") + " - Maximum Sent",
				msg: "You have already sent the maximum amount of " + Rudolphs_Presents.get_text("present", true) + "s to this user, you can't send anymore.",
				width: 350,
				height: 150

			});

			return false;
		}

		if(!Rudolphs_Presents.api.space(yootil.page.member.id()).left()){
			new Rudolphs_Presents_Info_Dialog({

				title: Rudolphs_Presents.get_text("dialog_title") + " - Error",
				msg: "This user can't receive anymore " + Rudolphs_Presents.get_text("present", true) + "s, their inventory is full.",
				width: 350,
				height: 150

			});

			return false;
		}

		if(!this.item_dialog){
			let list = this.build_items_list();

			this.item_dialog = $("<div></div>").html(list).rudolphs_presents({

				//(529)

				title: Rudolphs_Presents.get_text("dialog_title"),
				resizable: true,
				draggable: true,
				modal: true,
				width: 720,
				height: 500,
				autoOpen: false,
				buttonPaneExtra: this.build_button_pane_extra(),
				buttons: [

					{

						text: "Send",
						click: this.send_present.bind(this),
						disabled: true,
						class: "rudolphs-presents-dialog-send-button",
						id: "rudolphs-presents-dialog-send-button"

					},

					{

						text: "Close",
						click: () => this.item_dialog.rudolphs_presents("close")

					}

				]


			});
		}

		$(".rudolphs-presents-dialog").find("span.rudolphs-presents-item").on("click", this.select_item.bind(this));

		this.item_dialog.rudolphs_presents("open");

		return false;
	}

	build_items_list(){
		let list = "";

		for(let y = 0; y < 23; y ++){
			for(let x = 0; x < 23; x ++){
				let id = x + "_" + y;
				let x_offset = x * 64;
				let y_offset = y * 64;

				if(!y && !x){
					x_offset += 2;
					y_offset += 2;
				} else {
					x_offset += (4 * x) + 2;
					y_offset += (4 * y) + 2;
				}

				list += "<span data-present-id='" + id + "' class='rudolphs-presents-item' style='background-image: url(\"" + Rudolphs_Presents.images.items + "\"); background-position: -" + x_offset + "px -" + y_offset + "px;'> </span>";
			}
		}

		return list;
	}

	send_present(){
		let sender = new Rudolphs_Presents_Sender();

		sender.item(this.selected.id);
		sender.from(yootil.user.id(), yootil.user.username());

		if(sender.has_space(yootil.page.member.id())){
			$("#rudolphs-presents-dialog-send-button").button("disable").addClass("rudolphs-presents-dialog-send-button");

			sender.send({

				user_id: yootil.page.member.id(),
				success: () => {

					if(!Rudolphs_Presents.api.get(yootil.user.id()).unlimited()){
						sender.update_tokens();
					}

					sender.update_total_sent();

					this.reset_item_dialog();
					this.update_token_counter();

					Rudolphs_Presents.api.sync(yootil.user.id());

					new Rudolphs_Presents_Info_Dialog({

						title: Rudolphs_Presents.get_text("dialog_title") + " - " + Rudolphs_Presents.get_text("present") + " Sent",
						msg: "Your " + Rudolphs_Presents.get_text("present", true) + " was successfully sent.",
						width: 350,
						height: 150

					});
				},

				error: (status) => {
					this.item_dialog.rudolphs_presents("close");
					this.reset_item_dialog();

					new Rudolphs_Presents_Info_Dialog({

						title: Rudolphs_Presents.get_text("token") + " - Error",
						msg: "For some reason we could not deliver this item.<br /><br />Error: " + yootil.html_encode(status.message),
						width: 350,
						height: 150

					});
				}
			});
		} else {
			new Rudolphs_Presents_Info_Dialog({

				title: Rudolphs_Presents.get_text("dialog_title") + " - Error",
				msg: "This user can't receive anymore items, their inventory is full.",
				width: 350,
				height: 150

			});
		}
	}

	reset_item_dialog(){
		this.item_dialog.rudolphs_presents("close");

		if(this.selected){
			this.selected.span.removeClass("rudolphs-presents-item-selected");
			this.selected = null;
		}
	}

	update_token_counter(){
		let tokens = Rudolphs_Presents.api.get(yootil.user.id()).tokens();

		if(Rudolphs_Presents.api.get(yootil.user.id()).unlimited()){
			tokens = "Unlimited";
		} else {
			tokens = parseInt(tokens, 10); // Should move parsing to the tokens method really.
		}

		$("#rudolphs-presents-presents-left-counter").text(tokens);
	}

	select_item(evt){
		let $span = $(evt.currentTarget);

		if(this.selected){
			this.selected.span.removeClass("rudolphs-presents-item-selected");
		}

		$span.addClass("rudolphs-presents-item-selected");

		this.selected = {

			id: $span.attr("data-present-id"),
			span: $span

		}

		$("#rudolphs-presents-dialog-send-button").button("enable").removeClass("rudolphs-presents-dialog-send-button");
	}

	build_button_pane_extra(){
		let $extra = $("<div class='rudolphs-presents-dialog-button-pane-extra'></div>");
		let tokens = Rudolphs_Presents.api.get(yootil.user.id()).tokens();

		if(Rudolphs_Presents.api.get(yootil.user.id()).unlimited()){
			tokens = "Unlimited";
		} else {
			tokens = parseInt(tokens, 10); // Should move parsing to the tokens method really.
		}

		$extra.append('<button type="button" id="rudolphs-presents-presents-left-button" class="ui-button"><span class="ui-button-text"><strong>Present Tokens:</strong> <span id="rudolphs-presents-presents-left-counter">' + tokens + '</span></span></button>').on("click", () => {

			new Rudolphs_Presents_Info_Dialog({

				title: Rudolphs_Presents.get_text("dialog_title") + " - " + Rudolphs_Presents.get_text("token") + "s",
				msg: "This is the amount of items you have left to send.<br /><br />When posting, you have chance to earn more.",
				width: 350,
				height: 160

			});

		});

		return $extra;
	}

}