/**
 *  Tracker
 *  Copyright 2018 James Houck, REI Automation, Inc. All rights reserved.
 */

/** MongoDB Driver **/
    const Mongo = require('mongodb').MongoClient
    const ObjectId = require('mongodb').ObjectID

/** Create Database Path and Schema Objects **/
    let dbPath = ''
    let dbName = ''

/** Initialize Database Path and Schema **/
    exports.initialize = function (configPath, configDatabase) {
        dbPath = configPath
        dbName = configDatabase
    }

/** Load Views **/
    const types = require('./db-types')

/** MongoDB find Function **/
    exports.get = function (api) {
        if (api.find == '') { api.find = {} }
        for (var key in api.sort) {
            if (api.sort[key] == '1') { api.sort[key] = 1 }
            if (api.sort[key] == '-1') { api.sort[key] = -1 }
        }
        if ('_id' in api.find) {
            api.find._id = ObjectId(api.find._id)
        }
        if ('proj_ID' in api.find) {
            api.find.proj_ID = ObjectId(api.find.proj_ID)
        }

    //  Create new promise object
        return new Promise((resolve, reject) => {

        //  Connect to Mongodb database
            Mongo.connect(dbPath, (err, client) => {
                if (err) { return reject(err) }

            //  Set database collection
                let db = client.db(dbName)
                let cl = db.collection(api.coll)

            //  Find documents
                cl.find(api.find).sort(api.sort)
                  .toArray((err, resultARY) => {
                      if (err) { return reject(err) }
                      client.close()
                      return resolve(resultARY)
                })
            })
        })
    }

/** MongoDB updateOne Function **/
    exports.put = function (api) {
        if (api.update == '') { api.update = [] }

    //  Create new promise object
        return new Promise((resolve, reject) => {

        //  Connect to Mongodb database
            Mongo.connect(dbPath, (err, client) => {
                if (err) { return reject(err) }

            //  Set database collection
                let db = client.db(dbName)
                let cl = db.collection(api.coll)

            //  Create bulk object
                let bulk = cl.initializeUnorderedBulkOp();
                for (let idx = 0; idx < api.update.length; idx++) {

                //  Convert Id String to Object
                    let id = ObjectId(api.update[idx]._id)

                //  Parse set values from strings into types
                    let set = api.update[idx].set
                    for (key in set) {
                        let val = parse(types[key], set[key])
                        api.update[idx].set[key] = val
                    }

                //  Insert Timestamp
                    set.update_TS = new Date()
                    set.update_TAG = api.user

                    bulk.find({_id: id}).updateOne({ $set: set })
                }
            //  Update Documents
                bulk.execute((err, result) => {
                    if (err) { return reject(err) }
                    client.close()
                    return resolve(result)
                })
            })
        })
    }

/** MongoDB insertMany Function **/
    exports.post = function (api) {
        if (api.insert == '') { api.insert = [] }
        for (let idx = 0; idx < api.insert.length; idx++) {

        //  Parse set values from strings into types
            let item = api.insert[idx]
            for (key in item) {
                let val = parse(types[key], item[key])
                api.insert[idx][key] = val
            }

        //  Convert ID Strings to Objects
            api.insert[idx].proj_ID = ObjectId(api.insert[idx].proj_ID)
            if ('parent_ID' in api.insert[idx]) {
                api.insert[idx].parent_ID = ObjectId(api.insert[idx].parent_ID)
            }

        //  Update Timestamp
            api.insert[idx].insert_TS = new Date()
            api.insert[idx].insert_TAG = api.user
        }

    //  Create new promise object
        return new Promise((resolve, reject) => {

        //  Connect to Mongodb database
            Mongo.connect(dbPath, (err, client) => {
                if (err) { return reject(err) }

            //  Set database collection
                let db = client.db(dbName)
                let cl = db.collection(api.coll)

            //  Insert documents
                cl.insertMany(api.insert, (err, result) => {
                    if (err) { return reject(err) }
                    client.close()
                    return resolve(result)
                })
            })
        })
    }

function parse (type, value) {
    switch (type) {
    case 'id':
        return ObjectId(value)
    case 'string':
        return value
    case 'number':
        return Number(value)
    case 'currency':
        return Number(value)
    case 'date':
        if (value != '') {
            let strARY = []
            if (/-/.test(value)) { strARY = value.split('-') }
            if (/\//.test(value)) { strARY = value.split('/') }
            let month = parseInt(strARY[0] - 1)
            let date = parseInt(strARY[1])
            let year = ''
            if (strARY[2].length === 2) { year = parseInt('20' + strARY[2]) }
            else { year = parseInt(strARY[2]) }
            return new Date(year, month, date).getTime()
        } else { return '' }
    }
    return value
}
