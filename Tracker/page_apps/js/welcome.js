/**
 *  Tracker
 *  Copyright 2018 James Houck, REI Automation, Inc. All rights reserved.
 */

/** Application Initialization **/

let Page = Object.create(HTMLDoc)

let Menu = Object.create(NavigationBar)

    Menu.initialize({
        navLinks: '.navbar-brand, .nav-link'
    })

let Message = Object.create(ModalMessage)

    Message.initialize({
        modal: '#modal-message',
        text: '#modal-message-text'
    })

    Application.initialize({
        win: { page: Page, menu: Menu, message: Message }
    })

    Application.start( function () { })

/** User Profile **/
let SignIn = Object.create(SignInForm)

    SignIn.initialize({
        usernameInput: '#inp-username',
        passwordInput: '#inp-password',
        signinButton: '#btn-start'
    })

    UserProfile.initialize({
        win: { signIn: SignIn, message: Message, page: Page },
        query: { path: '/welcome/users' }
    })

/** Dispatch **/
let Dispatch = function (request) {
    UserProfile.action(request)
}
