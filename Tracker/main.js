/**
 *  Tracker
 *  Copyright 2018 James Houck, REI Automation, Inc. All rights reserved.
 */

/** Express Web Server **/

//  Load Express 4 Module
    const express = require('express')

//  An implementation of JSON Web Tokens
    const jwt = require('jsonwebtoken')

//  Simple parsing middleware for Express
    const bodyParser = require('body-parser')

//  Cookie parsing with signatures
    const cookieParser = require('cookie-parser')

//  Application Configuration Settings
    const conf = require('./config')

//  Navigation Grid Views
    const views = require('./views')

//  Navigation Grid Row Colors
    const colors = require('./colors')

//  Load Databse Module
    const db = require('./database')

//  Initialize Database Module
    db.initialize(conf.mongo.path, conf.mongo.database)

//  Create Express Application
    const ws = express()

//  Parse POST and URL parameters
    ws.use(bodyParser.json({ limit: '16mb' }))
    ws.use(bodyParser.urlencoded({ limit: '16mb', extended: true }))

//  Parse and Set cookies
    ws.use(cookieParser())

//  Serve Static Files
    ws.use(express.static(__dirname + conf.apps))

//  Start HTTP Server
    ws.listen(conf.port, () => {
        console.log(`${conf.name} running on port ${conf.port}`)
        console.log('Press Ctrl-C to terminate')
    })

//  Serve Default Route
    ws.get('/', function(req, res) {
        res.sendFile(__dirname + conf.apps + '/welcome.html')
    })

/** AUTHENTICATION **/

//  Authenticate User
    ws.get('/welcome/users', function (req, res) {
        let api = {
            appl: 'start',
            coll: 'users',
            find: req.query.find,
            sort: req.query.sort
        }
        db.get(api)
          .then( (results) => {
            if (results.length == 0) { res.json({ success: false }) }
            else if (results[0].active_BOL == true) {
                let doc = {
                    name: results[0].user_TAG,
                    group: results[0].group_STR
                }
                let token = jwt.sign(doc, conf.token, { expiresIn: '6d' })
                res.cookie('tracker', token)
                res.json({
                    success: true,
                    path: '/navigator',
                    username: results[0].user_TAG,
                    forename: results[0].forename_STR,
                    surname: results[0].surname_STR,
                    group: results[0].group_STR,
                    profile: results[0].profile,
                    admin: results[0].admin_BOL
                })
            } else { res.json({ success: false }) }
           })
          .catch( (err) => { res.send(err) })

    })

//  Middleware to Verify Token
    ws.use( function (req, res, next) {
        let token = req.cookies.tracker
        if (token) {
            jwt.verify(token, conf.token, (err, decoded) => {
                if (err) { return res.redirect('/') }
                else {
                    req.user = decoded
                    next()
                }
            })
        } else { return res.redirect('/') }
    })

/** AUTHENTICATED ROUTES **/

//  Serve Navigator Application
    ws.get('/navigator', function (req, res) {
        res.sendFile(__dirname + conf.apps + '/navigator.html')
    })

//  Serve Navigator Parts Grid Views
    ws.get('/navigator/views', function (req, res) {
        res.json(views[req.user.group])
    })

//  Serve Navigator Parts Grid Colors
    ws.get('/navigator/colors', function (req, res) {
        res.json(colors[req.query.find.schema])
    })

//  Serve Manager Application
    ws.get('/manager', function (req, res) {
        res.sendFile(__dirname + conf.apps + '/manager.html')
    })

//  GET Resource
    ws.get('/:appl/:coll', function (req, res) {
        let api = {
            appl: req.params.appl,
            coll: req.params.coll,
            find: req.query.find,
            sort: req.query.sort,
            user: req.user
        }
        db.get(api).then( (results) => {  res.json(results) })
          .catch( (err) => { res.send(err) })
    })

//  PUT Resource
    ws.put('/:app/:coll', function (req, res) {
        let api = {
            app: req.params.app,
            coll: req.params.coll,
            update: req.body.update,
            user: req.user.name
        }
        db.put(api).then( (results) => { res.json(results) })
          .catch( (err) => { res.send(err) })
    })

//  POST Resource
    ws.post('/:app/:coll', function (req, res) {
        let api = {
            app: req.params.app,
            coll: req.params.coll,
            insert: req.body.insert,
            user: req.user.name
        }
        db.post(api).then( (result) => {
            if (result.insertedCount > 0) {
                for (let idx = 0; idx < result.ops.length; idx++) {
                    result.ops[idx]._id = result.insertedIds[idx]
                }
                res.json({ inserted: true, items: result.ops })
            } else {
                res.json({ inserted: false, items: null })
            }
        })
          .catch( (err) => { res.send(err) })
    })
