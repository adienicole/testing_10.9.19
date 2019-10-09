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

        case 'APP_RESET':
            Parts.action({
                action: 'RESET',
                message: { filter: false }
            })
            PartsEditor.action({
                action: 'RESET',
                message: { insert: false, more: false }
            })
            Assemblies.action({
                action: 'RESET',
                message: null
            })
            ProjectItems.action({
                action: 'RESET',
                message: null
            })
            ProjectsList.action({
                action: 'RESET',
                mesage: null
            })
            break
        }
    }
}

let ProjectsList = {

    initialize: function (init) {
        this.win = init.win
        this.view = init.view
        this.query = init.query
        this.projects = []
        this.info = {}
        this.project = null
    },

    action: function (request) {
        switch (request.action) {

        case 'QUERY_PROJECTS_LIST':
            this.queryServer()
            break

        case 'DISPLAY_SELECTED_PROJECT':
            let val = request.message
            if (val == 'null') { this.queryProjects() }
            else { this.loadProject(val) }
            break

        case 'CHANGE_SETTING':
            let key = request.message.key
            if (key == 'projectsAll') {
                this.win.select.clear()
                this.displayProjects()
            }
            break

        case 'RETRIEVE_PROJECT':
            return this.project

        case 'RETRIEVE_PROJECT_INFO':
            let projID = request.message
            return {
                id: projID,
                name: this.info[projID][this.view.name],
                desc: this.info[projID][this.view.desc]
            }

        case 'RESET':
            this.project = null
            this.win.select.set('null')
            break
        }
    },

    store: function (items) {
        this.projects = items
        this.displayProjects()

        for (let idx = 0; idx < items.length; idx++) {
            let projID = items[idx][this.view.id]
            this.info[projID] = this.projects[idx]
        }

        Application.action({
            action: 'READY',
            message: 'ProjectsList'
        })
    },

    displayProjects: function () {
        let showAll = UserProfile.action({
            action: 'RETRIEVE_SETTING',
            message: 'projectsAll'
        })
        let showProjects = []
        if (!showAll) {
            for (let idx = 0; idx < this.projects.length; idx++) {
                if (this.projects[idx].active_BOL) {
                    showProjects.push(this.projects[idx])
                }
            }
        } else { showProjects = this.projects }
        this.win.select.render(this.view, showProjects)
    },

    queryProjects: function () {
        Parts.action({
            action: 'RESET',
            message: { filter: false }
        })
        PartsEditor.action({
            action: 'RESET',
            message: { insert: false }
        })
        Assemblies.action({
            action: 'RESET',
            message: null
        })
        ProjectItems.action({
            action: 'RESET',
            message: null
        })
        ProjectsQuery.action({
            action: 'RESET',
            message: null
        })
    },

    loadProject: function (val) {
        this.project = { id: val, info: this.info[val] }

        ProjectItems.action({
            action: 'QUERY_PROJECT_DATA',
            message: this.project.id
        })
    },

    queryServer: function () {
        let query = { find: null, sort: { proj_TAG: 1 } }
        let ajaxOBJ = {
            method: 'GET', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (results) => {
            if (results != null) { this.store(results) }
            else {
                this.win.message.display('ERROR: Projects not found.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Projects List AJAX request failed!')
        })
    }
}

let ViewsList = {

    initialize: function (init) {
        this.win = init.win
        this.query = init.query
        this.viewIDX = 0
    },

    action: function (request) {
        switch (request.action) {

        case 'QUERY_VIEWS_LIST':
            this.queryServer()
            break

        case 'RETRIEVE_SELECTED_VIEW':
            return this.views[this.viewIDX]

        case 'DISPLAY_SELECTED_VIEW':
            this.viewIDX = request.message
            break
        }
    },

    store: function (items) {
        this.views = items
        this.win.select.render(this.views)
        Application.action({
            action: 'READY',
            message: 'ViewsList'
        })
    },

    queryServer: function () {
        let query = { find: null }
        let ajaxOBJ = {
            method: 'GET', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (results) => {
            if (results != null) { this.store(results) }
            else {
                this.win.message.display('ERROR: Views not found.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Views List AJAX request failed!')
        })
    }
}

let ProjectsQuery = {

    initialize: function (init) {
        this.win = init.win
        this.query = init.query
        this.view = init.view
        this.projects = null
        this.projectID = null
    },

    action: function (request) {
        switch (request.action) {

        case 'RETRIEVE_PROJECT_ITEMS':
            this.projectID = request.message
            return this.projects[request.message]

        case 'RETRIEVE_ALL_PROJECT_ITEMS':
            return this.items

        case 'UPDATE_PROJECT_ITEMS':
            if (this.projects != null) {
                return this.updateProjectItems(request.message)
            } else { return null }

        case 'QUERY_PROJECTS':
            let inputs = request.message
            let find = {}
            for (key in inputs) {
                if (inputs[key] != '') { find[key] = inputs[key] }
            }
            this.queryServer(find)
            break

        case 'RESET':
            this.projects = null
            this.projectID = null
            break
        }
    },

    store: function (items) {
        this.items = items
        this.projects = {}
        let itemsLEN = items.length
        let idx = 0
        while (idx < itemsLEN) {
            let projID = items[idx][this.view.projID]
            if (projID != '') {
                if (!(projID in this.projects)) {
                    this.projects[projID] = [items[idx]]
                } else {
                    this.projects[projID].push(items[idx])
                }
            }
            idx++
        }
        this.displayProjects()
    },

    updateProjectItems: function (items) {
        for (let idx = 0; idx < items.length; idx++) {
            let set = items[idx].set
            for (key in set) {
                let projARY = this.projects[items[idx].project]
                for (let idy = 0; idy < projARY.length; idy++) {
                    if (items[idx]._id == projARY[idy]._id) {
                        this.projects[items[idx].project][idy][key] = set[key]
                    }
                }
            }
        }
        return true
    },

    displayProjects: function () {
        this.win.sidebar.renderItem({
            id: 'show-all',
            name: 'Find Results',
            desc: 'Display all items'
        })
        Parts.action({
            action: 'DISPLAY_SELECTED_PROJECT_ITEMS',
            message: 'show-all'
        })

        for (key in this.projects) {
            let info = ProjectsList.action({
                action: 'RETRIEVE_PROJECT_INFO',
                message: key
            })
            this.win.sidebar.renderItem(info)
        }
    },

    queryServer: function (find) {
        let query = { find: find, sort: null }
        let ajaxOBJ = {
            method: 'GET', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (results) => {
            if (results != null) { this.store(results) }
            else {
                this.win.message.display('ERROR: Project Items not found.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Project Items AJAX request failed!')
        })
    }
}

let ProjectItems = {

    initialize: function (init) {
        this.win = init.win
        this.query = init.query
        this.view = init.view
        this.ancestors = null
    },

    action: function (request) {
        switch (request.action) {

        case 'QUERY_PROJECT_DATA':
            this.queryServer(request.message)
            break

        case 'RETRIEVE_NODE_ITEMS_BY_TYPE':
            let id = request.message.id
            let type = request.message.type
            return this.ancestors[id][type]

        case 'RETRIEVE_ALL_NODE_ITEMS':
            return this.retrieveAllItems(request.message)

        case 'UPDATE_NODE_LEAFS':
            if (this.ancestors != null) {
                return this.updateNodeLeafs(request.message)
            } else { return null }

        case 'INSERT_NODE_LEAFS':
            return this.insertNodeLeafs(request.message)

        case 'INSERT_NEW_NODE':
            this.insertNewNode(request.message)
            break

        case 'RESET':
            this.ancestors = null
            break
        }
    },

    store: function (items) {
        this.ancestors = {}
        let itemsLEN = items.length
    //  Hash ancestors as keys into an object
    //  and create 'nodes' and 'leafs' arrays for each ancestor
        let idx = 0
        while (idx < itemsLEN) {
            let ancestorID = items[idx][this.view.parent]
            let itemID = items[idx][this.view.id]
            let itemType = items[idx][this.view.type]
            if (!(ancestorID in this.ancestors)) {
                if ((ancestorID != null) && (ancestorID != '')) {
                    this.ancestors[ancestorID] = { nodes: [], leafs: [] }
                } else {
                    this.rootITEM = items[idx]
                    this.ancestors[itemID] = { nodes: [], leafs: [] }
                }
            }
            if (itemType == 'assembly') {
                this.ancestors[itemID] = { nodes: [], leafs: [] }
            }
            idx++
        }
    //  Sort the children of an ancestor into 'nodes' and 'leafs'
    //  and push them into arrays mapped to the ancestor
        let idy = 0
        while (idy < itemsLEN) {
            let itemID = items[idy][this.view.id]
            let ancestorID = items[idy][this.view.parent]
            if (itemID in this.ancestors) {
                if ((ancestorID != null) && (ancestorID != '')) {
                    this.ancestors[ancestorID].nodes.push(items[idy])
                }
            } else {
                this.ancestors[ancestorID].leafs.push(items[idy])
            }
            idy++
        }

        Dispatch({
            action: 'DISPLAY_ROOT_ITEMS',
            message: this.rootITEM
        })
    },

    retrieveAllItems: function (nodeID) {
        let items = this.ancestors[nodeID].leafs

    //  Create new array instead of reference or shallow copy
        let blankARY = []
        let nodes = blankARY.concat(this.ancestors[nodeID].nodes)

        while (nodes.length > 0) {
            let nextNode = nodes.pop()
            let nextNodeID = nextNode[this.view.id]
            let newItems = items.concat(this.ancestors[nextNodeID].leafs)
            let newNodes = nodes.concat(this.ancestors[nextNodeID].nodes)
            items = newItems
            nodes = newNodes
        }
        return items
    },

    queryServer: function (projectID) {
        let query = { find: { proj_ID: projectID }, sort: null }
        let ajaxOBJ = {
            method: 'GET', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (results) => {
            if (results != null) { this.store(results) }
            else {
                this.win.message.display('ERROR: Project Items not found.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Project Items AJAX request failed!')
        })
    },

    updateNodeLeafs: function (updates) {
        for (let idx = 0; idx < updates.length; idx++) {
            let id = updates[idx][this.view.id]
            let set = updates[idx].set
            let leafs = this.ancestors[updates[idx].parent].leafs
            for (let idy = 0; idy < leafs.length; idy++) {
                if (leafs[idy][this.view.id] == id) {
                    for (key in set) {
                        this.ancestors[updates[idx].parent].leafs[idy][key] = set[key]
                    }
                }
            }
        }
        return true
    },

    insertNodeLeafs: function (inserts) {
        let parent = Assemblies.action({
            action: 'RETRIEVE_PARENT',
            message:  null
        })
        for (let idx = 0; idx < inserts.length; idx++) {
            this.ancestors[parent.id].leafs.push(inserts[idx])
        }
        return parent.id
    },

    insertNewNode: function (node) {
        let nodeID = node[this.view.id]
        let parentID = node[this.view.parent]

        this.ancestors[nodeID] = { nodes: [], leafs: [] }
        this.ancestors[parentID].nodes.push(node)
    }
}

let Assemblies = {

    initialize: function (init) {
        this.win = init.win
        this.view = init.view
        this.query = init.query
        this.import = { insert: false, update: false }
    },

    action: function (request) {
        switch (request.action) {

        case 'DISPLAY_ROOT_ITEMS':
            this.store(request.message)
            break

        case 'DISPLAY_SELECTED_NODE_ITEMS':
            this.updateRecent(request.message)
            this.win.add.displaySelected(this.nodes[this.now.id].name)
            ImportParts.action({
                action: 'DISPLAY_SELECT_NODE_IN_MODAL',
                message: this.nodes[this.now.id].name
            })
            break

        case 'RETRIEVE_PARENT':
            let id = this.now.id
            let name = this.nodes[id].name
            return { id: id, name: name }

        case 'ADD_NEW_ASSEMBLY':
            this.addAssembly(request.message.name, request.message.desc)
            break

        case 'ADD_NEW_ASSEMBLIES':
            this.addMultipleAssemblies(request.message)
            break

        case 'SAVE_MUTLI_ASSEMBLIES':
            this.saveMultipleAssemblies()
            break

        case 'RESET':
            this.rootID = null
            this.nodes = {}
            this.old = { id: null, level: null }
            this.now = { id: null, level: null }
            this.win.sidebar.clearNodes()
            this.import = { insert: false, update: false }
            break
        }
    },

    store: function (rootITEM) {

        this.rootID = rootITEM[this.view.id]
        let rootName = rootITEM[this.view.name]

        this.nodes = {}
        this.nodes[this.rootID] = { name: rootName, active: true, level: 0 }

        this.displayRoot(rootITEM)
        this.win.add.displaySelected(rootName)
        ImportParts.action({
            action: 'DISPLAY_SELECT_NODE_IN_MODAL',
            message: this.nodes[this.now.id].name
        })
    },

    displayRoot: function (root) {

        this.old = { id: null, level: null }
        this.now = { id: root[this.view.id], level: 0 }

        this.win.sidebar.renderRoot(this.view, root)

        Parts.action({
            action: 'DISPLAY_SELECTED_NODE_ITEMS',
            message: root[this.view.id]
        })

        this.displayNodes(this.now.id, this.now.level)
    },

    updateRecent: function (nodeID) {

        this.old.id = this.now.id
        this.old.level = this.now.level
        this.now.id = nodeID
        this.now.level = this.nodes[nodeID].level

        if (this.now.level > this.old.level) {
            this.displayNodes(this.now.id, this.now.level)
            this.nodes[this.now.id].active = true
        }

        if ((this.now.level <= this.old.level) && (this.now.level != 0)) {
            this.closeNodes(this.now.level)

            this.displayNodes(this.now.id, this.now.level)
            this.nodes[this.now.id].active = true
        }

        if (this.now.level == 0) { this.closeNodes(1) }
    },

    displayNodes: function (nodeID, nodeLevel) {

        let items = ProjectItems.action({
            action: 'RETRIEVE_NODE_ITEMS_BY_TYPE',
            message: { id: nodeID, type: 'nodes' }
        })

        if (items.length > 0) {

            let subLevel = nodeLevel + 1

            for (let idx = 0; idx < items.length; idx++) {
                let itemID = items[idx][this.view.id]
                let itemName = items[idx][this.view.name]
                this.nodes[itemID] = { name: itemName, active: false, level: subLevel }
            }

            this.win.sidebar.toggleArrows(nodeID, 'open')
            this.win.sidebar.renderNodes(nodeID, this.view, items, subLevel)
        }
    },

    closeNodes: function (nodeLevel) {
        let minLevel = 2
        if (nodeLevel != 0) { minLevel = nodeLevel + 1 }

        for (key in this.nodes) {
            let level = this.nodes[key].level
            if (level >= minLevel) {
                this.win.sidebar.removeNode(key)
                this.nodes.active = false
                this.nodes[key].level = -1
            }
            let active = this.nodes[key].active
            if ((level = nodeLevel) && (active)) {
                this.win.sidebar.toggleArrows(key, 'close')
                this.nodes[key].active = false
            }
        }
    },

    addAssembly: function (name, desc) {
        let parentID = this.now.id
        let parentName = this.nodes[parentID].name

        let project = ProjectsList.action({
            action: 'RETRIEVE_PROJECT',
            message: null
        })

        let inserts = [{
            proj_ID: project.id,
            proj_TAG: project.info.proj_TAG,
            parent_ID: parentID,
            parent_TAG: parentName,
            part_TAG: name,
            dscr_STR: desc,
            type_STR: 'assembly'
        }]
        this.queryServer(inserts)
    },

    addMultipleAssemblies: function (asmbs) {
        this.win.addMulti.displaySelected(this.nodes[this.now.id].name)
        let parentId = this.now.id
        let parentName = this.nodes[parentId].name
        for (key in asmbs) {
            if (key == 0) {
                let partNum = parentName
                let descr = ''
                let parts = asmbs[key].parts.length
                this.win.addMulti.appendList(partNum, descr, parts)
            } else {
                let partNum = asmbs[key].info.part_TAG
                let descr = asmbs[key].info.dscr_STR
                let parts = asmbs[key].parts.length
                this.win.addMulti.appendList(partNum, descr, parts)
            }
        }
        this.win.addMulti.displayModal()
    },

    saveMultipleAssemblies: function () {
        let parentId = this.now.id
        let parentName = this.nodes[parentId].name

        let project = ProjectsList.action({
            action: 'RETRIEVE_PROJECT',
            message: null
        })

        let asmbs = ImportParts.action({
            action: 'GET_IMPORTED_ASSEMBLIES',
            message: null
        })

        this.win.addMulti.closeModal()

        let idx = 2
        let act = true
        let inserts = []
        while (act) {
            let keyReal = false
            for (key in asmbs) {
                keyARY = key.split('.')
                if (keyARY.length == idx) {
                    keyReal = true
                    let parentIDX = keyARY[0]
                    for (let idz = 1; idz < keyARY.length - 1; idz++) {
                        parentIDX = parentIDX + '.' + keyARY[idz]
                    }
                    let assembly = asmbs[key].info
                    if (parentIDX == 0) {
                        assembly.parent_TAG = parentName
                    } else {
                        assembly.parent_TAG = asmbs[parentIDX].info.part_TAG
                    }
                    assembly.proj_ID = project.id
                    assembly.proj_TAG = project.info.proj_TAG
                    assembly.type_STR = 'assembly'
                    inserts.push(assembly)
                }
            }
            idx++
            if (!keyReal) { act = false }
        }

        this.queryServer(inserts)
    },

    queryServer: function (inserts) {
        let query = { insert: inserts }
        let ajaxOBJ = {
            method: 'POST', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (result) => {
            if (result != null) {
                if (result.items.length > 1) { this.updateAssemblies(result) }
                else { this.insertProjectItems(result) }
            }
            else {
                this.win.message.display('ERROR: Assembly Insert failed.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Assembly AJAX request failed!')
        })
    },

    insertProjectItems: function (result) {
        if (result.inserted) {
            ProjectItems.action({
                action: 'INSERT_NEW_NODE',
                message: result.items[0]
            })
            this.insertNode(result.items[0])
        } else {
            this.win.message.display('ERROR: Add Assembly save failed!')
        }
    },

    updateAssemblies: function (result) {
        if (result.inserted) {

            let project = ProjectsList.action({
                action: 'RETRIEVE_PROJECT',
                message: null
            })

            let asmbs = ImportParts.action({
                action: 'GET_IMPORTED_ASSEMBLIES',
                message: null
            })

        //  Insert parts into assemblies
            let inserts = []
            for (let idz = 0; idz < result.items.length; idz++) {
                let asmbId = result.items[idz]._id
                let asmbName = result.items[idz].part_TAG
                for (key in asmbs) {
                    if (asmbs[key].info.part_TAG == asmbName) {
                        let parts = asmbs[key].parts
                        for (let idq = 0; idq < parts.length; idq++) {
                            let item = parts[idq]
                            item.proj_ID = project.id
                            item.proj_TAG = project.info.proj_TAG
                            item.parent_ID = asmbId
                            item.parent_TAG = asmbName
                            inserts.push(item)
                        }
                    }
                }
            }

        //  Insert parts into selected assembly
            let selcParentId = this.now.id
            let selcParent = this.nodes[selcParentId].name

            for (let idr = 0; idr < asmbs[0].parts.length; idr++) {
                let item = asmbs[0].parts[idr]
                item.proj_ID = project.id
                item.proj_TAG = project.info.proj_TAG
                item.parent_ID = selcParentId
                item.parent_TAG = selcParent
                inserts.push(item)
            }

            this.insertParts(inserts)

        //  Update assembly ids
            let updates = []
            for (let idx = 0; idx < result.items.length; idx++) {
                let part = result.items[idx].part_TAG
                let partId = result.items[idx]._id
                let parent = result.items[idx].parent_TAG
                let parentId = null
                for (let idy = 0; idy < result.items.length; idy++) {
                    if (result.items[idy].part_TAG == parent) {
                        parentId = result.items[idy]._id
                    }
                }
                if (parentId == null) { parentId = selcParentId }
                let item = { _id: partId, set: { } }
                item.set.parent_ID = parentId
                updates.push(item)
            }
            this.updateServer(updates)
        } else {
            this.win.message.display('ERROR: Add Assembly save failed!')
        }
    },

    updateServer: function (updates) {
        let query = { update: updates }
        let ajaxOBJ = {
            method: 'PUT', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (result) => {
            if ((result != null) && (result.ok > 0)) {
                this.reloadProject('update')
            }
            else {
                this.win.message.display('ERROR: Asemblies Update failed.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Asemblies AJAX request failed!')
        })
    },

    reloadProject: function (action) {
        if (action == 'insert') { this.import.insert = true }
        if (action == 'update') { this.import.update = true }
        if ((this.import.insert) && (this.import.update)) {
            this.import = { insert: false, update: false }
            let project = ProjectsList.action({
                action: 'RETRIEVE_PROJECT',
                message: null
            })
            ProjectItems.action({
                action: 'QUERY_PROJECT_DATA',
                message: project.id
            })
        }
    },

    insertNode: function (node) {
        let nodeID = node[this.view.id]
        let subLevel = this.now.level + 1
        let parentID = node[this.view.parent]
        this.nodes[nodeID] = {
            name: node[this.view.name],
            active: false,
            level: subLevel
        }
        this.win.sidebar.renderNode(parentID, this.view, node, subLevel)
    },

    insertParts: function (inserts) {
        let query = { insert: inserts }
        let ajaxOBJ = {
            method: 'POST', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (result) => {
            if (result.items.length > 0) { this.reloadProject('insert') }
            else {
                this.win.message.display('ERROR: Parts Insert failed.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Parts AJAX request failed!')
        })
    }
}

let Parts = {

    initialize: function (init) {
        this.win = init.win
        this.query = init.query

        this.currNodeID = ''
        this.prevNodeID = ''
        this.filter = {}
        this.colors = {}
        this.blankRowIndex = 0
        this.items = []
        this.filterActive = false
    },

    action: function (request) {
        switch (request.action) {

        case 'QUERY_COLORS':
            let schemaName = UserProfile.action({
                action: 'RETRIEVE_SETTING',
                message: 'colorsSchema'
            })
            this.queryServer(schemaName)
            Application.action({
                action: 'READY',
                message: 'Parts'
            })
            break

        case 'RETRIEVE_COLORS':
            return this.colors

        case 'DISPLAY_SELECTED_NODE_ITEMS':
            this.filterActive = true
            this.displayNodeState(request.message)
            this.storeNodeItems(request.message)
            this.win.grid.disableFind()
            PartsEditor.action({
                action: 'RESET',
                message: { insert: true, more: true }
            })
            break

        case 'DISPLAY_SELECTED_PROJECT_ITEMS':
            this.filterActive = true
            this.displayNodeState(request.message)
            this.storeProjectItems(request.message)
            this.win.grid.disableFind()
            break

        case 'DISPLAY_SELECTED_VIEW':
            this.displayView(this.items)
            break

        case 'APPEND_NEW_ITEMS':
            this.appendNewItems(request.message)
            break

        case 'DISPLAY_FILTERED_ITEMS':
            this.filter = request.message
            this.displayFilter(this.items)
            break

        case 'RETRIEVE_FILTERED_ITEMS':
            return this.retrieveFilteredItems()

        case 'RETRIEVE_PARTS_ITEMS':
            return this.items

        case 'STORE_FILTER_INPUTS':
            this.filter = request.message
            break

        case 'CLEAR_FILTER':
            this.filter = {}
            this.displayFilter(this.items)
            break

        case 'CHANGE_SETTING':
            let key = request.message.key
            if (key == 'highlightRows') { this.displayView(this.items) }
            if (key == 'showAll') { this.storeNodeItems(this.currNodeID) }
            break

        case 'INSERT_BLANK_ROW':
            this.insertBlankRow()
            break

        case 'RESET':
            this.filterActive = request.message.filter
            this.items = []
            this.currNodeID = ''
            this.prevNodeID = ''
            this.filter = {}
            this.blankRowIndex = 0

            let view = ViewsList.action({
                action: 'RETRIEVE_SELECTED_VIEW',
                message: null
            })
            this.win.grid.renderHead(view, this.filterActive)
            this.win.grid.clearBody()
            this.win.grid.enableFind()
            break
        }
    },

    displayNodeState: function (id) {
        let copyNodeID = this.currNodeID
        this.prevNodeID = copyNodeID
        this.currNodeID = id

        if (this.prevNodeID != '') {
            this.win.grid.highlightNode(this.prevNodeID, 'off')
        }
        this.win.grid.highlightNode(id, 'on')
    },

    storeNodeItems: function (nodeID) {
        let proj = ProjectsList.action({
            action: 'RETRIEVE_PROJECT',
            message: null
        })
        if (proj != null) {
            let retrieveAll = UserProfile.action({
                action: 'RETRIEVE_SETTING',
                message: 'itemsAll'
            })
            if (retrieveAll) {
                this.items = ProjectItems.action({
                    action: 'RETRIEVE_ALL_NODE_ITEMS',
                    message: nodeID
                })
            } else {
                this.items = ProjectItems.action({
                    action: 'RETRIEVE_NODE_ITEMS_BY_TYPE',
                    message: { id: nodeID, type: 'leafs' }
                })
            }
            this.displayView(this.items)
        }
    },

    storeProjectItems: function (projID) {
        if (projID == 'show-all') {
            this.items = ProjectsQuery.action({
                action: 'RETRIEVE_ALL_PROJECT_ITEMS',
                message: null
            })
        } else {
            this.items = ProjectsQuery.action({
                action: 'RETRIEVE_PROJECT_ITEMS',
                message: projID
            })
        }
        this.displayView(this.items)
    },

    storeColors: function (schema) {
        this.colors = {
            active: null,
            key: 'status_STR',
            schema: schema
        }
    },

    displayView: function(items) {
        this.updateSettings()
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        this.win.grid.renderHead(view, this.filterActive)
        this.win.grid.renderBody(view, items, this.filter, this.colors, false)
    },

    displayFilter: function (items) {
        this.updateSettings()
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        this.win.grid.renderBody(view, items, this.filter, this.colors, false)
    },

    retrieveFilteredItems: function () {
        return this.win.grid.retrieveItems()
    },

    appendNewItems: function (items) {
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        for (let idx = 0; idx < items.length; idx++) {
            items[idx]['_id'] = `new-${this.blankRowIndex}`
            this.blankRowIndex = this.blankRowIndex + 1
        }
        this.win.grid.renderBody(view, items, this.filter, this.colors, true)
        PartsEditor.action({
            action: 'STORE_NEW_ITEMS',
            message: items
        })
    },

    insertBlankRow: function () {
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        this.win.grid.insert(view, this.blankRowIndex)
        this.blankRowIndex = this.blankRowIndex + 1
    },

    updateSettings: function () {
        let colorsActive = UserProfile.action({
            action: 'RETRIEVE_SETTING',
            message: 'colorsActive'
        })

        this.colors.active = colorsActive
    },

    queryServer: function (schemaName) {
        let query = { find: { schema: schemaName } }
        let ajaxOBJ = {
            method: 'GET', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (results) => {
            if (results != null) { this.storeColors(results) }
            else {
                this.win.message.display('ERROR: Colors not found.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Colors List AJAX request failed!')
        })
    }
}

let PartsEditor = {

    initialize: function (init) {
        this.win = init.win
        this.query = init.query

        this.edits = []
        this.newItems = []
        this.errors = []
        this.active = false
        this.saveActive = { update: false, insert: false }
        this.rules = {}
    },

    action: function (request) {
        switch (request.action) {

        case 'STORE_EDIT':
            this.edits.push(request.message)
            this.active = true
            break

        case 'STORE_NEW_ITEMS':
            this.storeNewItems(request.message)

        case 'STORE_ERROR':
            this.errors.push(request.message)
            break

        case 'SAVE_EDITS':
            this.saveEdits(this.edits)
            break

        case 'DISABLE_INSERT':
            this.win.edit.disableInsert()
            break

        case 'DISPLAY_SELECTED_VIEW':
            this.setRules()
            break

        case 'APPLY_RULE':
            this.applyRule(request.message.id, request.message.field, this.edits)
            break

        case 'FILL_STATUS':
            this.fillStatus()
            break

        case 'RESET':
            this.insertActive = request.message.insert
            if (this.insertActive) { this.win.edit.enableInsert() }
            else { this.win.edit.disableInsert() }
            if (request.message.more) { this.win.edit.enableMore() }
            else { this.win.edit.disableMore() }
            this.edits = []
            this.errors = []
            this.updates = []
            this.inserts = []
            this.newItems = []
            this.active = false
            this.saveActive.update = false
            this.saveActive.insert = false
            this.setRules()
            break
        }
    },

    storeNewItems: function (items) {
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        let tform = {}
        for (let idx = 0; idx < view.columns.length; idx++) {
            tform[view.columns[idx].field] = view.columns[idx].dtype
        }
        let project = ProjectsList.action({
                action: 'RETRIEVE_PROJECT',
                message: null
            })

        let parent = Assemblies.action({
                action: 'RETRIEVE_PARENT',
                message:  null
            })
        for (let idy = 0; idy < items.length; idy++) {
            let id = items[idy]._id
            let newItem = {}
            for (key in items[idy]) {
                if (key != '_id') {
                    let field = key
                    let data = items[idy][key]
                    let type = tform[key]
                    let test = this.win.edit.testNew(id, field, data, type)
                    if (test.valid) {
                        newItem[field] = test.value
                    }
                }
            }
            newItem.proj_ID = project.id
            newItem.proj_TAG = project.info.proj_TAG
            newItem.parent_ID = parent.id
            newItem.parent_TAG = parent.name
            this.newItems.push(newItem)
            this.active = true
            this.win.edit.enableSave()
        }
    },

    fillStatus: function () {
        console.log('Fill Status')
    },

    saveEdits: function (edits) {
        this.updates = []
        this.inserts = []
        for (let idx = 0; idx < edits.length; idx++) {
            let id = edits[idx].id
            let field = edits[idx].field
            let value = edits[idx].value
            let type = edits[idx].type
            let text = edits[idx].text
            let parent = edits[idx].parent
            let project = edits[idx].project
            let idARY = id.split('-')
            if (idARY[0] == 'insert') {
                let idno = idARY[1]
                if (typeof this.inserts[idno] === 'undefined') {
                    this.inserts[idno] = {}
                }
                this.inserts[idno][field] = value
            } else {
                let updateItem = {
                    _id: id, parent: parent, project: project, set: {}
                }
                updateItem.set[field] = value
                this.updates.push(updateItem)
            }
        }

        if (this.inserts.length > 0) {
            let project = ProjectsList.action({
                    action: 'RETRIEVE_PROJECT',
                    message: null
                })

            let parent = Assemblies.action({
                    action: 'RETRIEVE_PARENT',
                    message:  null
                })
            let insertItems = []
            for (let idx = 0; idx < this.inserts.length; idx++) {
                let item = {}
                if (typeof this.inserts[idx] != 'undefined') {
                    item = this.inserts[idx]
                    item.proj_ID = project.id
                    item.proj_TAG = project.info.proj_TAG
                    item.parent_ID = parent.id
                    item.parent_TAG = parent.name
                }
                insertItems.push(item)
            }
            this.insertServer(insertItems)
        }

        if (this.newItems.length > 0) {
            this.saveActive.insert = true
            this.insertServer(this.newItems)
        }

        if (this.updates.length > 0) {
            this.saveActive.update = true
            this.updateServer(this.updates)
        }

        this.edits = []
        this.errors = []
        this.active = false
    },

    updateServer: function (updates) {
        let query = { update: updates }
        let ajaxOBJ = {
            method: 'PUT', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (result) => {
            if (result != null) { this.updateProjectItems(result) }
            else {
                this.win.message.display('ERROR: Parts Editor Update failed.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Parts Editor AJAX request failed!')
        })
    },

    insertServer: function (inserts) {
        let query = { insert: inserts }
        let ajaxOBJ = {
            method: 'POST', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (result) => {
            if (result != null) { this.insertProjectItems(result) }
            else {
                this.win.message.display('ERROR: Parts Editor Insert failed.')
            }
        })
        .fail( () => {
            this.win.message.display('ERROR: Parts Editor AJAX request failed!')
        })
    },

    updateProjectItems: function (result) {
        if (result.ok > 0) {
            let parentID = ProjectItems.action({
                action: 'UPDATE_NODE_LEAFS',
                message: this.updates
            })
            let projectID = ProjectsQuery.action({
                action: 'UPDATE_PROJECT_ITEMS',
                message: this.updates
            })
            this.saveActive.update = false

            let colors = Parts.action({
                action: 'RETRIEVE_COLORS',
                message: null
            })
            this.win.edit.removeBackground(this.updates, colors)
        } else {
            this.win.message.display('ERROR: Parts Editor save failed!')
        }
        this.updates = []
    },

    insertProjectItems: function (result) {
        if (result.inserted) {
            let parentID = ProjectItems.action({
                action: 'INSERT_NODE_LEAFS',
                message: result.items
            })
            this.saveActive.insert = false
            this.displaySavedItems(parentID)
        } else {
            this.win.message.display('ERROR: Parts Editor save failed!')
        }
        this.inserts = []
    },

    displaySavedItems: function (parentID) {
        if ((!this.saveActive.update) && (!this.saveActive.insert)) {
            Parts.action({
                action: 'DISPLAY_SELECTED_NODE_ITEMS',
                message: parentID
            })
        }
    },

    setRules: function () {
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        this.rules = view.rules
    },

    applyRule: function (id, field, edits) {
        if (field in this.rules) {
            let rule = this.rules[field]
            for (let idz = 0; idz < rule.length; idz++) {
                let operands = [] //  this.rule[field].operands
                for (let idx = 0; idx < rule[idz].operands.length; idx++) {
                    operands[idx] = null
                    for (let idy = 0; idy < this.edits.length; idy++) {
                        if ((edits[idy].field == rule[idz].operands[idx])
                         && (edits[idy].id == id)) {
                            operands[idx] = edits[idy].value
                        }
                    }
                    if (operands[idx] == null) {
                        let gridField = rule[idz].operands[idx]
                        operands[idx] = this.win.edit.retrieveValue(id, gridField)
                    }
                }
                let func = new Function('ops', rule[idz].function)
                let result = func(operands)
                let parent = this.win.edit.retrieveAttrValue(id, 'parent')
                let project = this.win.edit.retrieveAttrValue(id, 'project')
                if (result != null) {
                    this.win.edit.setValue(id, rule[idz].result, result)
                    this.edits.push({
                        id: id,
                        field: rule[idz].result,
                        value: result,
                        parent: parent,
                        project: project
                    })
                }
            }
        }
    }
}

let ImportParts = {

    initialize: function (init) {
        this.win = init.win
        this.asmbs = {}
    },

    action: function (request) {
        switch (request.action) {

        case 'DISPLAY_SELECT_NODE_IN_MODAL':
            this.win.file.displaySelected(request.message)
            break

        case 'LOAD_IMPORTED_ITEMS':
            this.viewTransform(request.message.data)
            break

        case 'GET_IMPORTED_ASSEMBLIES':
        return this.asmbs
        }
    },

    viewTransform: function (data) {
        let view = ViewsList.action({
            action: 'RETRIEVE_SELECTED_VIEW',
            message: null
        })
        let tform = {}
        for (let idx = 0; idx < view.columns.length; idx++) {
            tform[view.columns[idx].title] = view.columns[idx].field
        }
        if ('INDEX' in data[0]) { this.parseAssemblies(tform, data) }
        else { this.parseItems(tform, data) }
    },

    parseItems: function (tform, data) {
        let items = []
        for (let idy = 0; idy < data.length; idy++) {
            let item = {}
            for (key in data[idy]) {
                item[tform[key]] = data[idy][key]
            }
            items.push(item)
        }
        Parts.action({
            action: 'APPEND_NEW_ITEMS',
            message: items
        })
    },

    parseAssemblies: function (tform, data) {
        this.asmbs = {}
        let asmbFlag = false
        let asmbIndex = ''
        let index = ''
        let indexARY = []
        let indexLEN = 0
        let prevItem = { INDEX: '0' }
        let prevIndex = '0'
        let prevIndexLEN = 1
        for (let idy = 0; idy < data.length; idy++) {
            let item = {}
            for (key in data[idy]) {
                if (key == 'INDEX') {
                    index = '0.' + data[idy][key]
                    indexARY = index.split('.')
                    indexLEN = indexARY.length
                    if (indexLEN > prevIndexLEN) { asmbFlag = true }
                    else { asmbFlag = false }
                } else {
                    item[tform[key]] = data[idy][key]
                }
            }
            if (asmbFlag) {
                this.asmbs[prevIndex] = {}
                this.asmbs[prevIndex].info = prevItem
                this.asmbs[prevIndex].parts = []
            } else {
                let prevIndexARY = prevIndex.split('.')
                let asmbIndex = prevIndexARY[0]
                for (let idz = 1; idz < prevIndexARY.length - 1; idz++) {
                    asmbIndex = asmbIndex + '.' + prevIndexARY[idz]
                }
                if (asmbIndex in this.asmbs) {
                    this.asmbs[asmbIndex].parts.push(prevItem)
                }
            }
            prevItem = item
            prevIndex = index
            prevIndexLEN = indexLEN
            let prevIndexARY = index.split('.')
            if (idy == data.length - 1) {
                let indexARY = index.split('.')
                let asmbIndex = indexARY[0]
                for (let idr = 1; idr < indexARY.length - 1; idr++) {
                    asmbIndex = asmbIndex + '.' + prevIndexARY[idr]
                }
                if (asmbIndex in this.asmbs) {
                    this.asmbs[asmbIndex].parts.push(item)
                }
            }
        }
        Assemblies.action({
            action: 'ADD_NEW_ASSEMBLIES',
            message: this.asmbs
        })
    }
}

let ExportParts = {

    initialize: function (init) {
        this.win = init.win
    },

    action: function (request) {
        switch (request.action) {

        case 'DISPLAY_EXPORT_PARTS':
            this.displayParts()
            break
        }
    },

    displayParts: function () {
        let items = Parts.action({
            action: 'RETRIEVE_PARTS_ITEMS',
            message: null
        })

        let filterItems = Parts.action({
            action: 'RETRIEVE_FILTERED_ITEMS',
            message: null
        })

        this.win.table.clearRows()

        for (let idx = 0; idx < items.length; idx++) {
            let itemId = items[idx]._id
            if (itemId in filterItems) {
                this.win.table.displayRow(items[idx])
            }
        }
    }
}

let UserProfile = {

    initialize: function (init) {
        this.win = init.win
        this.query = init.query
        this.view = init.view
    },

    action: function (request) {
        switch (request.action) {

        case 'AUTHENTICATE_USER':
            this.authenticateUser(request.message)
            break

        case 'LOAD_PROFILE':
            this.load()
            Application.action({
                action: 'READY',
                message: 'UserProfile'
            })
            break

        case 'CHANGE_SETTING':
            let key = request.message.key
            let value = request.message.value
            for (setting in this.view) {
                let name = this.view[setting].name
                if (name == key) { this.profile.set[setting] = value }
            }

        case 'RETRIEVE_SETTING':
            return this.profile.set[request.message]
        }
    },

    authenticateUser: function (credentials) {
        if (credentials.username == '') {
            this.win.message.display('Missing information. Enter username.')
        }
        else if (credentials.password == '') {
            this.win.message.display('Missing information. Enter password.')
        }
        else { this.queryServer(credentials) }
    },

    store: function (result) {
        if (result.success) {
            sessionStorage.setItem('username', result.username)
            sessionStorage.setItem('forename', result.forename)
            sessionStorage.setItem('surname', result.surname)
            sessionStorage.setItem('group', result.group)
            sessionStorage.setItem('colorsActive', result.profile.colorsActive)
            sessionStorage.setItem('colorsSchema', result.profile.colorsSchema)
            sessionStorage.setItem('itemsAll', result.profile.itemsAll)
            sessionStorage.setItem('projectsAll', result.profile.projectsAll)
            sessionStorage.setItem('admin', result.admin)
            this.requestPage(result.path)
        } else {
            this.win.message.display('ERROR: Invalid credentials.')
        }
    },

    load: function () {
        this.profile = {
            bio: {
                username: this.retrieve('username'),
                forename: this.retrieve('forename'),
                surname: this.retrieve('surname'),
                group: this.retrieve('group'),
                admin: this.retrieve('admin'),
            },
            set: {
                colorsActive:this.retrieve('colorsActive'),
                colorsSchema: this.retrieve('colorsSchema'),
                itemsAll: this.retrieve('itemsAll'),
                projectsAll: this.retrieve('projectsAll')
            }
        }
        this.initializeIcon(this.profile.set)
    },

    retrieve: function (prop) {
        let value = sessionStorage.getItem(prop)
        if (value == 'true') { value = true }
        if (value == 'false') { value = false }
        return value
    },

    initializeIcon: function (settings) {
        for (key in settings) {
            if (this.view[key].type == 'checkbox') {
                this.win.icon.initCheckbox(this.view[key].name, settings[key])
            }
            if (this.view[key].type == 'select') {
                let items = [settings[key]]
                this.win.icon.initSelect(this.view[key].name, items)
            }
        }
    },

    requestPage: function (path) {
        this.win.page.open(path, '_self')
    },

    queryServer: function (cred) {
        let query = {
            find: { user_TAG: cred.username, auth_STR: cred.password },
            sort: null
        }
        let ajaxOBJ = {
            method: 'GET', url: this.query.path,
            data: query, dataType: 'json'
        }
        $.ajax(ajaxOBJ).done( (result) => { this.store(result) })
        .fail( () => {
            this.win.message.display('ERROR: User Profile AJAX request failed!')
        })
    }
}
