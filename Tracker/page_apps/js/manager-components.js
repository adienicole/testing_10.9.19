/**
 *  Tracker
 *  Copyright 2018 James Houck, REI Automation, Inc. All rights reserved.
 */

let HTMLDoc = {

    ready: function (func) {
        $(document).ready(func)
    },

    open: function (path) {
        window.open(path, '_self')
    }
}

let NavigationBar = {

    initialize: function (init) {
        this.navLinks = init.navLinks
        this.sideToggle = init.sideToggle
        this.navSidebar = init.navSidebar
        this.mainContent = init.mainContent
        this.sidebar = true

        $(this.navLinks).click( (event) => {
            event.preventDefault()
            let href = $(event.target).attr('href')
            $(href).modal()
        })

        $(this.sideToggle).click( () => { this.toggleSidebar() })
    },

    toggleSidebar: function () {
        if (this.sidebar) {
            $(this.navSidebar).removeClass('d-sm-block')
            $(this.mainContent).removeClass('col-sm-9 col-md-10 ml-sm-auto')
            $(this.mainContent).addClass('col-12')
            this.sidebar = false
        } else {
            $(this.navSidebar).addClass('d-sm-block')
            $(this.mainContent).removeClass('col-12')
            $(this.mainContent).addClass('col-sm-9 col-md-10 ml-sm-auto')
            this.sidebar = true
        }
    }
}

let ModalMessage = {

    initialize: function (init) {
        this.modal = init.modal
        this.text = init.text
    },

    display: function (message) {
        $(this.text).html(message)
        $(this.modal).modal()
    }
}
