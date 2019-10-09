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

let Reset = Object.create(ResetButton)

    Reset.initialize({
        resetBtn: '#btn-reset'
    })

    Application.initialize({
        win: { page: Page, reset: Reset, menu: Menu, message: Message },
        ready: {
            UserProfile: false,
            ViewsList: false,
            Parts: false,
            ProjectsList: false
        },
        run: function () {
            Parts.action({
                action: 'RESET',
                message: { filter: false }
            })
            PartsEditor.action({
                action: 'RESET',
                message: { insert: false, more: false }
            })
        }
    })

    Application.start( function () {

        UserProfile.action({
            action: 'LOAD_PROFILE',
            message: null
        })

        ProjectsList.action({
            action: 'QUERY_PROJECTS_LIST',
            message: null
        })

        ViewsList.action({
            action: 'QUERY_VIEWS_LIST',
            message: null
        })

        Parts.action({
            action: 'QUERY_COLORS',
            message: null
        })
    })

/** UserProfile **/
let Settings = Object.create(ModalSettings)

    Settings.initialize({
        checkBox: {
            highlightRows: '#check-highlight-rows',
            showAll: '#check-show-all',
            projectsAll: '#projects-show-all'
        },
        select: {
            selectColorScheme: '#select-highlight-schema'
        }
    })

    UserProfile.initialize({
        win: { icon: Settings },
        query: { path: '/navigator/users' },
        view: {
            colorsActive: { name: 'highlightRows', type: 'checkbox' },
            colorsSchema: { name: 'selectColorScheme', type: 'select' },
            itemsAll: { name: 'showAll', type: 'checkbox' },
            projectsAll: { name: 'projectsAll', type: 'checkbox' }
        }
    })

/** Projects List **/
let ProjectSelector = Object.create(ProjectSelect)

    ProjectSelector.initialize({
        selectID: '#select-project'
    })

    ProjectsList.initialize({
        win: { select: ProjectSelector, message: Message },
        query: { path: '/navigator/projects' },
        view: { id: '_id', name: 'proj_TAG',
            desc: 'projDscr_STR', cust: 'cust_TAG'
        }
    })

/** Views List **/
let ViewSelector = Object.create(ViewSelect)

    ViewSelect.initialize({
        selectID: '#select-view'
    })

    ViewsList.initialize({
        win: { select: ViewSelector, message: Message },
        query: { path: '/navigator/views' }
    })

/** Projects Query **/
let SideBarProjects = Object.create(SideBarList)

    SideBarProjects.initialize({
        listID: '#sidebar'
    })

    ProjectsQuery.initialize({
        win: { sidebar: SideBarProjects, message: Message },
        query: { path: '/navigator/parts' },
        view: { id: '_id', projID: 'proj_ID' }
    })

/** Project Items **/
    ProjectItems.initialize({
        win: { message: Message },
        query: { path: '/navigator/parts' },
        view: { id: '_id', parent: 'parent_ID', type: 'type_STR' }
    })

/** Project Assemblies in Side Bar **/
let SideBar = Object.create(SideBarGroup)
    SideBar.initialize({
        listID: '#sidebar',
        circleIcon: 'img/circle.png',
        closedIcon: 'img/closed.png',
        expandIcon: 'img/expand.png'
    })

let AddAssembly = Object.create(ModalAddNode)
    AddAssembly.initialize({
        parentHd: '#add-node-parent',
        nameInp: '#add-node-name',
        descInp: '#add-node-desc',
        insertBtn: '#add-node-insert',
        nameAlert: '#add-node-name-alert',
        descAlert: '#add-node-desc-alert',
        modal: '#modal-add-node'
    })

let AddMultiAssemblies = Object.create(ModalAddMultiNodes)
    AddMultiAssemblies.initialize({
        parentHd: '#add-multi-nodes-parent',
        listID: '#add-multi-nodes-list',
        saveBtn: '#add-multi-nodes-save',
        modal: '#modal-add-multi-nodes'
    })

    Assemblies.initialize({
        win: { sidebar: SideBar, message: Message,
            add: AddAssembly, addMulti: AddMultiAssemblies },
        view: { id: '_id', parent: 'parent_ID',
            name: 'part_TAG', desc: 'dscr_STR'
        },
        query: { path: '/navigator/parts' }
    })

/** Project Parts in Grid Model **/
let PartsGrid = Object.create(DataGrid)
    PartsGrid.initialize({
        headID: '#grid-header',
        bodyID: '#grid-body',
        findBtn: '#btn-find'
    })

    Parts.initialize({
        win: { grid: PartsGrid, message: Message },
        query: { path: '/navigator/colors' }
    })

let PartsEdit = Object.create(GridEdit)
    PartsEdit.initialize({
        bodyID: '#grid-body',
        insertBtn: '#btn-insert',
        saveBtn: '#btn-save',
        moreBtn: '#btn-more',
        fillBtn: '#btn-status-fill'
    })

    PartsEditor.initialize({
        win: { edit: PartsEdit, message: Message },
        query: { path: '/navigator/parts' }
    })

let FileImport = Object.create(ModalImport)
    FileImport.initialize({
        parentHd: '#import-parts-parent',
        fileInput: '#import-parts-file',
        fileAlert: '#import-parts-file-alert',
        loadBtn: '#import-parts-load',
        modal: '#modal-import-parts'
    })

    ImportParts.initialize({
        win: { file: FileImport }
    })

let TableExport = Object.create(ModalExport)
    TableExport.initialize({
        tableRows: '#export-parts-rows'
    })

    ExportParts.initialize({
        win: { table: TableExport }
    })

/** Dispatch **/
let Dispatch = function (request) {
    Application.action(request)
    UserProfile.action(request)
    ProjectsList.action(request)
    ViewsList.action(request)
    ProjectsQuery.action(request)
    ProjectItems.action(request)
    Assemblies.action(request)
    Parts.action(request)
    PartsEditor.action(request)
    ImportParts.action(request)
    ExportParts.action(request)
}
