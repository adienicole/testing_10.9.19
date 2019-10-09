/**
 *  Tracker
 *  Copyright 2018 James Houck, REI Automation, Inc. All rights reserved.
 */

let Application = {

    initialize: function initialize (init) {
        this.win = init.win
        this.ready = init.ready
        this.run = init.run
    },

    start: function (func) { this.win.page.ready(func) },

    action: function (request) {
        switch (request.action) {

        case 'READY':
            let com = request.message
            this.ready[com] = true

            let readyComplete = true
            for (key in this.ready) {
                if (!this.ready[key]) { readyComplete = false }
            }
            if (readyComplete) { this.run() }
            break
        }
    }
}
