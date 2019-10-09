/**
 *  Tracker
 *  Copyright 2018 James Houck, REI Automation, Inc. All rights reserved.
 */

/** Application Initialization **/
let Page = Object.create(HTMLDoc)

let Menu = Object.create(NavigationBar)

    Menu.initialize({
        navLinks: '.navbar-brand, .nav-link, .dropdown-item',
        sideToggle: '#btn-side-toggle',
        navSidebar: '#nav-sidebar',
        mainContent: '#main-content'
    })

let Message = Object.create(ModalMessage)

    Message.initialize({
        modal: '#modal-message',
        text: '#modal-message-text'
    })

Application.initialize({
    win: { page: Page, menu: Menu, message: Message },
    ready: {
        //
    },
    run: function () {
        //
    }
})

Application.start( function () {
    //
})

/** Dispatch **/
let Dispatch = function (request) {
    //
}
