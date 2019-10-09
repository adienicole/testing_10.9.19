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

let ResetButton = {

    initialize: function (init) {
        this.resetBtn = init.resetBtn

        $(this.resetBtn).click( () => {
            Dispatch({
                action: 'APP_RESET',
                message: null
            })
        })
    }
}

let ProjectSelect = {

    initialize: function (init) {
        this.selectID = init.selectID
    },

    render: function (view, items) {
        this.append(this.selectID, view, items)
        this.activate(this.selectID)
    },

    append: function (selectID, view, items) {
        for (let idx = 0; idx < items.length; idx++) {
            let id = items[idx][view.id]
            let name = items[idx][view.name]
            let desc = items[idx][view.cust]
            let option = `<option value="${id}">${name} ${desc}</option>`
            $(selectID).append(option)
        }
    },

    clear: function () {
        $(this.selectID).empty()
        let option = '<option value="null">Search Projects</option>'
        $(this.selectID).append(option)
    },

    activate: function (selectID) {
        $(selectID).change( () => {
            let projID = $(`${selectID} option:selected`).attr('value')
            Dispatch({
                action: 'DISPLAY_SELECTED_PROJECT',
                message: projID
            })
        })
    },

    set: function (val) {
        $(this.selectID).val(val)
    }
}

let ViewSelect = {

    initialize: function (init) {
        this.selectID = init.selectID
    },

    render: function (items) {
        this.append(this.selectID, items)
        this.activate(this.selectID)
    },

    append: function (selectID, items) {
        for (let idx = 0; idx < items.length; idx++) {
            let name = items[idx].name
            let option = `<option value="${idx}">${name}</option>`
            $(selectID).append(option)
        }
    },

    activate: function (selectID) {
        $(selectID).change( () => {
            let viewIDX = $(`${selectID} option:selected`).attr('value')
            Dispatch({
                action: 'DISPLAY_SELECTED_VIEW',
                message: viewIDX
            })
        })
    }
}

let SideBarList = {

    initialize: function (init) {
        this.listID = init.listID
    },

    renderItem: function (node) {

    //  Insert node
        let html = `<button id="${node.id}" type="button"`
            + `class="node list-group-item list-group-item-action list-group-item-secondary">`
            + `<div class="text-truncate">${node.name}`
            + `<br>${node.desc}</div></button>`
        $(this.listID).append(html)

    //  Activate nodes
        $(`#${node.id}`).click( () => {
            Dispatch({
                action: 'DISPLAY_SELECTED_PROJECT_ITEMS',
                message: node.id
            })
        })
    }
}

let SideBarGroup = {

    initialize: function (init) {
        this.listID = init.listID
        this.circleIMG = init.circleIcon
        this.closedIMG = init.closedIcon
        this.expandIMG = init.expandIcon
        this.rootID = ''
    },

    renderRoot: function (view, root) {
        let id = root[view.id]
        let name = root[view.name]
        let desc = root[view.desc]

        this.rootID = root[view.id]

        let html = `<button id="${id}" type="button"`
            + `class="node list-group-item list-group-item-action list-group-item-secondary">`
            + `<img src="${this.circleIMG}" class="float-left mt-3 mr-2">`
            + `<div class="text-truncate">${name}`
            + `<br>${desc}</div></button>`
        $(this.listID).empty()
        $(this.listID).append(html)
        $(`#${id}`).click( () => {
            Dispatch({
                action: 'DISPLAY_SELECTED_NODE_ITEMS',
                message: id
            })
        })
    },

    renderNodes: function (nodeID, view, nodes, level) {
        for (let idx = nodes.length - 1; idx > -1; idx--) {
            this.renderNode(nodeID, view, nodes[idx], level)
        }
    },

    renderNode: function (nodeID, view, node, level) {

        let id = node[view.id]
        let name = node[view.name]
        let desc = node[view.desc]

    //  Insert node
        let html = `<button id="${id}" type="button"`
            + `class="node list-group-item list-group-item-action list-group-item-secondary">`
            + `<img src="${this.closedIMG}" class="float-left mt-3 mr-2">`
            + `<div class="text-truncate">${name}`
            + `<br>${desc}</div></button>`
        $(html).insertAfter(`#${nodeID}`)

    //  Insert level icons
        for (let idy = 0; idy < level - 1; idy++) {
            let html = `<img src="${this.closedIMG}"`
                + `class="float-left mt-3">`
            $(`#${id} img:first`).before(html)
        }

    //  Activate nodes
        $(`#${id}`).click( () => {
            Dispatch({
                action: 'DISPLAY_SELECTED_NODE_ITEMS',
                message: id
            })
        })
    },

    removeNode: function (nodeID) {
        $(`#${nodeID}`).remove()
    },

    clearNodes: function () {
        $(this.listID).empty()
    },

    toggleArrows: function (nodeID, state) {
    //  toggleArrows exclusion of root item
        if (nodeID != this.rootID) {
            if (state == 'open') {
                $(`#${nodeID} img`).attr('src', this.expandIMG)
            }
            if (state == 'close') {
                $(`#${nodeID} img`).attr('src', this.closedIMG)
            }
        }
    }
}

let DataGrid = {

    initialize: function (init) {
        this.headID = init.headID
        this.bodyID = init.bodyID
        this.findBtn = init.findBtn
        this.find = { active: true }
        this.filterItems = {}

        $(this.findBtn).click( () => {
            if (this.find.active) {
                let inputs = {}
                let userInput = false
                $('.filter').each( function () {
                    let key = $(this).attr('id')
                    let val = $(this).val()
                    inputs[key] = val
                    if (val != '') { userInput = true }
                })
                if (userInput) {
                    Dispatch({
                        action: 'QUERY_PROJECTS',
                        message: inputs
                    })
                }
            }
        })
    },

    enableFind: function () {
        this.find.active = true
        $(this.findBtn).prop("disabled", false)
    },

    disableFind: function () {
        this.find.active = false
        $(this.findBtn).prop("disabled", true)
    },

    renderHead: function(view, active) {
        this.renderTitle(this.headID, view, active)
        let inputs = this.renderFilter(this.headID, view, active)
        Dispatch({
            action: 'STORE_FILTER_INPUTS',
            message: inputs
        })
    },

    renderBody: function (view, rows, filter, colors, append) {
        this.renderRows(this.bodyID, view, rows, filter, colors, append)
    },

    clearBody: function () {
        $(this.bodyID).empty()
    },

    renderTitle: function (id, view) {
        let columns = view.columns

        $(id).empty()

    //  Create row
        let frag = document.createDocumentFragment()
        let row = document.createElement('div')
        row.className = 'row bg-grid-header pt-2'

    //  Create columns
        for (let idx = 0; idx < columns.length; idx++) {
            let colAttr = columns[idx]
            let col = document.createElement('div')
            col.className = `col-${colAttr.width}`
            let elm = document.createElement('h6')
            elm.textContent = colAttr.title
            col.appendChild(elm)
            row.appendChild(col)
        }
        frag.appendChild(row)
        $(id).append(frag)
    },

    renderFilter: function (id, view, active) {
        let columns = view.columns

    //  Create row
        let frag = document.createDocumentFragment()
        let row = document.createElement('div')
        row.className = 'row bg-grid-header'
        let inputs = {}

    //  Create columns
        for (let idx = 0; idx < columns.length; idx++) {
            let colAttr = columns[idx]
            var col = document.createElement('div')
            col.className = `col-${colAttr.width} pl-1 pr-1 pb-2`
            var elm = document.createElement('input')
            elm.id = colAttr.field
            elm.className = 'form-control form-control-sm filter'
            elm.type = 'text'
            col.appendChild(elm)
            row.appendChild(col)

            inputs[colAttr.field] = ''
        }
        frag.appendChild(row)
        $(id).append(frag)

    //  Keyup event
        if (active) {
            $('.filter').keyup( () => {
                let inputs = {}
                $('.filter').each( function () {
                    let key = $(this).attr('id');
                    let val = $(this).val();
                    inputs[key] = val;
                })
                Dispatch({
                    action: 'DISPLAY_FILTERED_ITEMS',
                    message: inputs
                })
            })
        }
        return inputs
    },

    renderRows: function (id, view, rows, filter, colors, append) {
        this.filterItems = {}
        let rowAttr = view.attributes
        let columns = view.columns

        if (!append) { $(id).empty() }

    //  Create fragment
        let frag = document.createDocumentFragment()
        for (let idx = 0; idx < rows.length; idx++) {

        //  Create row
            let row = document.createElement('div')
            row.id = rows[idx][rowAttr.id]
            row.setAttribute('data-parent', rows[idx].parent_ID)
            row.setAttribute('data-project', rows[idx].proj_ID)
            row.className = 'row grid-row border border-top-0'

        //  Set Background Color
            if (colors.active) {
                if (colors.schema.hasOwnProperty(rows[idx][colors.key])) {
                    row.style.background = colors.schema[rows[idx][colors.key]]
                }
            }

        //  Find row status
            let status = ''
            for (let idc = 0; idc < columns.length; idc++) {
                if (columns[idc].field == 'status_STR') {
                    status = rows[idx][columns[idc].field]
                }
            }
            if (status == undefined) { status = '' }

        //  Create row columns
            let filterRowMatch = true  // Set filter row match condition
            for (let idy = 0; idy < columns.length; idy++) {
                let colAttr = columns[idy]
                let col = document.createElement('div')
                col.className = `col-${colAttr.width} data`
                col.setAttribute('data-field', colAttr.field)
                col.setAttribute('data-type', colAttr.dtype)
                let applyEdit = true
                if (colAttr.rule != null) {
                    applyEdit = false
                    for (let idz = 0; idz < colAttr.rule.length; idz++) {
                        if (status == colAttr.rule[idz]) { applyEdit = true }
                    }
                }
                if (applyEdit) { col.contentEditable = colAttr.edit }
                else { col.contentEditable = false }
                let datum = rows[idx][colAttr.field]
                let text = this.formatData(datum, colAttr.dtype)
                col.textContent = text
                row.appendChild(col)

            //  Filter Row
                let key = colAttr.field
                let val = text
                if (filter[key] != '') {
                    var filterExp = new RegExp(filter[key], 'gi');
                    if (!filterExp.test(val)) { filterRowMatch = false }
                }
            }
            if (filterRowMatch) {
                frag.appendChild(row)
                this.filterItems[row.id] = null
            }
        }
        $(id).append(frag)
    },

    retrieveItems: function () {
        return this.filterItems
    },

    highlightNode: function (nodeID, state) {
        if (state == 'on') {
            $(`#${nodeID}`).addClass('list-group-item-success')
        }
        if (state == 'off') {
            $(`#${nodeID}`).removeClass('list-group-item-success')
        }
    },

    insert: function (view, index) {
        let rowAttr = view.attributes
        let columns = view.columns

        let row = document.createElement('div')
        row.id = `insert-${index}`
        row.className = 'row grid-row border border-top-0'

        for (let idy = 0; idy < columns.length; idy++) {
            let colAttr = columns[idy]
            let col = document.createElement('div')
            col.className = `col-${colAttr.width} data`
            col.setAttribute('data-field', colAttr.field)
            col.setAttribute('data-type', colAttr.dtype)
            col.contentEditable = colAttr.edit
            let text = ''
            col.textContent = text
            row.appendChild(col)
        }
        $(this.bodyID).prepend(row)
    },

    formatData: function (data, type) {
        if (data != undefined) {
            switch (type) {
            case 'string':
                return data.trim()
            case 'number':
                return data.toLocaleString('en-US')
            case 'currency':
                return data.toLocaleString('en-US')
            case 'date':
                let ts = new Date(data)
                let month = (ts.getMonth( ) + 1).toString( )
                let date = (ts.getDate( )).toString( )
                let year = (ts.getFullYear( )).toString( )
                return dateSTR = month + '-' + date + '-' + year
            }
        } else { return '' }
    }
}

let GridEdit = {

    initialize: function (init) {
        this.bodyID = init.bodyID
        this.insertBtn = init.insertBtn
        this.saveBtn = init.saveBtn
        this.moreBtn = init.moreBtn
        this.fillBtn = init.fillBtn

        this.item = { id: '', field: '', type: '', text: '' }
        this.input = { text:'', active: false }
        this.save = { active: false }
        this.insert = { active: false }
        this.edit = {}

        this.activateButtons(this.insertBtn, this.saveBtn, this.fillBtn)
        this.activateGrid(this.bodyID)
    },

    activateGrid: function (id) {

    //  Edit Field Focusin Event
        $(id).focusin( (event) => {
            $(event.target).css('outline-color', '#0000FF')
            this.item.id = $(event.target).parent().attr('id')
            this.item.field = $(event.target).attr('data-field')
            this.item.type = $(event.target).attr('data-type')
            this.item.parent = $(event.target).parent().attr('data-parent')
            this.item.project = $(event.target).parent().attr('data-project')
            this.item.text = $(event.target).text()
            this.input = { text:'', active: false }
            this.edit = {}
        })

    //  Edit Field Keyup Event
        $(id).keyup( (event) => {
            $(event.target)
            .css({ 'background-color': '#FFFF66', 'color': '#000000' });
            this.input.text = $(event.target).text();
            if (!this.input.active) {
                this.edit.id = this.item.id
                this.edit.field = this.item.field
                this.edit.type = this.item.type
                this.edit.text = this.item.text
                this.edit.parent = this.item.parent
                this.edit.project = this.item.project
                this.input.active = true
                this.enableSave()
            }
        })

    //  Edit Field Focusout Event
        $(id).focusout( (event) => {
            if (this.input.active) {
                this.testInput()
                Dispatch({
                    action: 'APPLY_RULE',
                    message: { id: this.edit.id, field: this.edit.field }
                })
            }
            this.input.active = false
        })
    },

    setValue: function (id, field, data) {
        $(`#${id} > div[data-field="${field}"]`).html(data)
        let type = $(`#${id} > div[data-field="${field}"]`).attr('data-type')
        this.testNew(id, field, data.toString(), type)
    },

    retrieveValue: function (id, field) {
        return $(`#${id} > div[data-field="${field}"]`).text()
    },

    retrieveAttrValue: function (id, field) {
        return $(`#${id}`).attr(`data-${field}`)
    },

    testInput: function () {
        let test = this.validate(this.input.text, this.item.type)
        if (test.valid) {
            $(event.target)
            .css({ 'background-color': '#00FF00', 'color': '#000000' })
            this.edit.input = this.input.text
            this.edit.value = test.value
            Dispatch({
                action: 'STORE_EDIT',
                message: this.edit
            })
        } else {
            $(event.target)
            .css({ 'background-color': '#FF0000', 'color': '#000000' })
            this.edit.input = this.input.text
            this.edit.value = test.value
            Dispatch({
                action: 'STORE_ERROR',
                message: this.edit
            })
        }
    },

    testNew: function (id, field, data, type) {
        let test = this.validate(data, type)
        if (test.valid) {
            $(`#${id} > div[data-field="${field}"]`)
            .css({ 'background-color': '#00FF00', 'color': '#000000' })
        } else {
            $(`#${id} > div[data-field="${field}"]`)
            .css({ 'background-color': '#FF0000', 'color': '#000000' })
        }
        return test
    },

    removeBackground: function (items, colors) {
        for (let idx = 0; idx < items.length; idx++) {
            let id = items[idx]._id
            let set = items[idx].set
            for (key in set) {
                let bkgdColor = $(`#${id} > div[data-field="${key}"]`)
                .css('background-color')
                if (bkgdColor != '#FF0000') {
                    $(`#${id} > div[data-field="${key}"]`)
                    .css({ 'background-color': '', 'color': '' })
                }

            //  Set Background Color
                if ((colors.active) && (key == 'status_STR')) {
                    if (colors.schema.hasOwnProperty(set[key])) {
                        rowBkgd = colors.schema[set[key]]
                        $(`#${id}`).css({ 'background-color': rowBkgd })
                    }
                }
            }
        }
    },

    activateButtons: function (insertID, saveID, fillID) {
        $(insertID).click( () => {
            if (this.insert.active) {
                Dispatch({
                    action: 'INSERT_BLANK_ROW',
                    message: null
                })
            }
        })
        $(saveID).click( () => {
            if (this.save.active) {
                if (this.input.active) { this.testInput() }
                Dispatch({
                    action: 'SAVE_EDITS',
                    message: null
                })
            }
        })
        $(fillID).click( () => {
            Dispatch({
                action: 'FILL_STATUS',
                message: null
            })
        })
    },

    enableSave: function () {
        this.save.active = true
        $(this.saveBtn).prop("disabled", false)
    },

    disableSave: function () {
        this.save.active = false
        $(this.saveBtn).prop("disabled", true)
    },

    enableInsert: function () {
        this.insert.active = true
        $(this.insertBtn).prop("disabled", false)
    },

    disableInsert: function () {
        this.insert.active = false
        $(this.insertBtn).prop("disabled", true)
    },

    enableMore: function () {
        //this.save.active = true
        $(this.moreBtn).prop("disabled", false)
    },

    disableMore: function () {
        //this.save.active = false
        $(this.moreBtn).prop("disabled", true)
    },

    validate: function (data, type) {
        switch (type) {
        case 'string':
            return { valid: true, value: data }
            break
        case 'number':
            let regExp1 = /^[-+]?\d+(\.\d+)?$/
            let test1 = regExp1.test(data)
            if ((test1) || (data == '')) {
                let newData = parseFloat(data.replace(/,/g, ''))
                return { valid: true, value: newData }
            } else { return { valid: false, value: null } }
            break
        case 'currency':
            let regExp2 = /^[-+]?[0-9]{1,3}(?:,?[0-9]{3})*\.?[0-9]+$/
            let test2 = regExp2.test(data)
            if ((test2) || (data == '')) {
                let newData = parseFloat(data.replace(/,/g, '')).toFixed(4)
                return { valid: true, value: newData }
            } else { return { valid: false, value: null } }
            break
        case 'date':
            var regExp3 = /^(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])-(?:[0-9]{2})?[0-9]{2}$/;
            var regExp4 = /^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/(?:[0-9]{2})?[0-9]{2}$/;
            let test3 = (regExp3.test(data)) || (regExp4.test(data))
            if ((test3) || (data == '')) {
                return { valid: true, value: data }
            } else { return { valid: false, value: null } }
            break
        }
    }
}

let SignInForm = {

    initialize: function (props) {
        this.usernameInput = props.usernameInput
        this.passwordInput = props.passwordInput
        this.signinButton = props.signinButton

        $(this.usernameInput).focus()
        $(this.signinButton).click( () => { this.query() })
        $(this.passwordInput).keypress( (e) => {
            if (e.which == 13) { this.query() }
        })
    },

    query: function () {
        let credentials = {}
        credentials.username = $(this.usernameInput).val()
        credentials.password = $(this.passwordInput).val()
        Dispatch({
            action: 'AUTHENTICATE_USER',
            message: credentials
        })
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
            if (href.indexOf('#') == 0) {
                if (href == '#modal-export-parts') {
                    Dispatch({
                        action: 'DISPLAY_EXPORT_PARTS',
                        message: null
                    })
                }
                $(href).modal()
            }
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

let ModalSettings = {

    initialize: function (init) {
        this.checkBox = init.checkBox
        this.select = init.select
    },

    initCheckbox: function (key, checked) {
        let id = this.checkBox[key]
        $(id).prop('checked', checked)
        $(id).change( function () {
            Dispatch({
                action: 'CHANGE_SETTING',
                message: { key: key, value: this.checked }
            })
        })
    },

    initSelect: function (key, items) {
        let id = this.select[key]
        for (let idx = 0; idx < items.length; idx++) {
            let name = items[idx]
            let option = `<option value="${idx}">${name}</option>`
            $(id).append(option)
        }
    }
}

let ModalAddNode = {

    initialize: function (init) {
        this.parentHd = init.parentHd
        this.nameInp = init.nameInp
        this.descInp = init.descInp
        this.nameAlert = init.nameAlert
        this.descAlert = init.descAlert
        this.insertBtn = init.insertBtn
        this.modal = init.modal

        $(this.insertBtn).click( () => {
            let name = $(this.nameInp).val()
            let desc = $(this.descInp).val()
            if (name == '') {
                $(this.nameAlert).append('Enter new assembly number.')
            }
            if (desc == '') {
                $(this.descAlert).append('Enter new assembly description.')
            }
            if ((name != '') && (desc != '')) {
                Dispatch({
                    action: 'ADD_NEW_ASSEMBLY',
                    message: { name: name, desc: desc }
                })
                $(this.modal).modal('hide')
            }
        })
    },

    displaySelected: function (name) {
        $(this.parentHd).empty()
        $(this.parentHd).append(name)
    }
}

let ModalAddMultiNodes = {

    initialize: function (init) {
        this.parentHd = init.parentHd
        this.listID = init.listID
        this.saveBtn = init.saveBtn
        this.modal = init.modal

        $(this.saveBtn).click( () => {
            Dispatch({
                action: 'SAVE_MUTLI_ASSEMBLIES',
                message: null
            })
        })
    },

    displayModal: function () {
        $(this.lisID).empty()
        $(this.modal).modal()
    },

    closeModal: function () {
        $(this.modal).modal('hide')
    },

    displaySelected: function (name) {
        $(this.parentHd).empty()
        $(this.parentHd).append(name)
    },

    appendList: function (numb, dscr, parts) {
        let html = `<li class="list-group-item list-group-item-success">`
            + `<div class="d-flex justify-content-between align-items-center">`
            + `<h5>${numb}</h5><span class="badge badge-primary badge-pill">`
            + `${parts}</span></div>${dscr}</li>`
        $(this.listID).append(html)
    }
}

let ModalImport = {

    initialize: function (init) {
        this.parentHd = init.parentHd
        this.fileInput = init.fileInput
        this.fileAlert = init.fileAlert
        this.loadBtn = init.loadBtn
        this.modal = init.modal

        $(this.loadBtn).click( () => {
            let fileName = $(this.fileInput).val()
            if (fileName != '') { this.loadData() }
            else {
                $(this.fileAlert).append('Select import file!')
            }
        })
    },

    loadData: function() {
        $(this.fileInput).parse({
            config: {
                delimiter: "",	// auto-detect
              	newline: "",	// auto-detect
              	quoteChar: '"',
              	escapeChar: '"',
              	header: true,
              	trimHeaders: true,
              	dynamicTyping: false,
              	preview: 0,
              	encoding: "",
              	worker: false,
              	comments: false,
              	step: undefined,
              	complete: function (results, file) {
	                  //console.log("Parsing complete:", results, file)
                    Dispatch({
                        action: 'LOAD_IMPORTED_ITEMS',
                        message: results
                    })
                },
              	error: undefined,
              	download: false,
              	skipEmptyLines: true,
              	chunk: undefined,
              	fastMode: undefined,
              	beforeFirstChunk: undefined,
              	withCredentials: undefined,
              	transform: undefined
            },
            before: function(file, inputElem) { },
            error: function(err, file, inputElem, reason) { },
            complete: function() { }
        })
        $(this.modal).modal('hide')
    },

    displaySelected: function (name) {
        $(this.parentHd).empty()
        $(this.parentHd).append(name)
    }
}

let ModalExport = {

    initialize: function (init) {
        this.tableRows = init.tableRows
    },

    clearRows: function () {
        $(this.tableRows).empty()
    },

    displayRow: function (item) {
        let html = `<tr><td>${item.mfr_STR}</td><td>${item.part_TAG}</td>`
          + `<td>${item.total_QTY}</td><td>${item.dscr_STR}</td></tr>`
        $(this.tableRows).append(html)
    }
}
