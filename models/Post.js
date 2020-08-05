//TODO: convert User.js to class syntax
const postsCollection = require('../db.js').db().collection('posts');
const followsCollection = require('../db.js').db().collection('follows');
const ObjectID = require('mongodb').ObjectID; // a tool from mongodb, pass on a string and creates a special Id object type
const User = require('./User')
const sanitizeHTML = require('sanitize-html');

class Post {
    constructor(data, userId, reqPostId){
        this.data = data;
        this.userId = userId;   // visitor id
        this.errors = [];       // for validation problems
        this.reqPostId = reqPostId; // the id of original Post from mongoDB
    };

    cleanUp(){
        if(typeof(this.data.title) != "string") {this.data.title = ""};
        if(typeof(this.data.body) != "string") {this.data.body = ""};

        this.data = {
            title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}), 
            body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
            creationDate: new Date(),
            author: ObjectID(this.userId)
        }; // filtering the properties we need; we dont store anything we shouldnt
    };

    validate(){
        // make sure neither title nor body are blank
        if (this.data.title == ""){this.errors.push("Debes proporcionar un título.")};
        if (this.data.body == ""){this.errors.push("El cuerpo del post no puede estar vacío.")}
    };

    create(){
        return new Promise((resolve, reject) => {
            this.cleanUp();
            this.validate();
            console.log(this.errors);
            if(!this.errors.length){
                // no errors, then save into db
                postsCollection.insertOne(this.data).then((info) =>{
                    resolve(info.ops[0]._id);
                }).catch(() => {
                    this.errors.push("Server DB problem. Try again later.")
                });
            } else{
                reject(this.errors);
            };
        });
    };

    update() {      // outer function
        return new Promise(async (resolve, reject) => {
            try {
                let post = await Post.findById(this.reqPostId, this.userId);
                // since this search uses postQuery it will have a "isVisitorOwner attribute"
                // it also proofs for non existing posts, which exception will be caught by the next block
                if (post.visitorIsOwner) {
                    let status = await this.updating();  // the real function talking to db
                    console.log("updating returned: " + status)
                    resolve(status);
                } else {
                    console.log("Visitor is not owner. Reject")
                    reject();
                }
            } catch {
                console.log("Problem while finding Single By Id")
                reject();
            }
        })
    }

    updating() {        // inner function
        return new Promise(async (resolve, reject) => {
            this.cleanUp();
            this.validate();
            if (!this.errors.length) {  // check errors detected by validate()
                await postsCollection.findOneAndUpdate({_id: new ObjectID(this.reqPostId)}, {$set: {title: this.data.title, body: this.data.body}});
                resolve("success");
            } else {
                // means there are validation errorss
                reject("failure");
            }
        });
    }

    // STATIC METHODS
    static postQuery(dbOps, visitorId) {
        return new Promise(async function(resolve, reject) {
            let aggOperations = dbOps.concat([
                {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDoc"}},
                {$project: {
                    title: 1,
                    body: 1,
                    creationDate: 1,
                    authorId: "$author",    // in mongodb, $ is the operator to indicate a variablename
                    author: {$arrayElemAt: ["$authorDoc", 0]}
                }}
                ]);     // concat method merges two arrays together, so it adds whatever is in [] to the original dbOps array
        
            let posts = await postsCollection.aggregate(aggOperations).toArray();

            posts = posts.map(function(post) {
                post.visitorIsOwner = post.authorId.equals(visitorId);
                post.authorId = undefined;
                post.author = {
                    username: post.author.username,
                    avatar: new User(post.author, true).avatar  // temporary instance to get the avatar url
                }
                return post;
            });
            resolve(posts);
        });
    }

    static findById(id, visitorId) {
        return new Promise(async function(resolve, reject) {
            if (typeof(id) != "string" || !ObjectID.isValid(id)){
                console.log("id is invalid. reject findbyId");
                reject();
                return;
            };
            // next we look in the whole collection for the author document that matches our correct post's author attribute id.
            // the author is saved as a new property to the new object
            let posts = await Post.postQuery([{$match: {_id: new ObjectID(id)}}], visitorId);
            // pass on the unique aggregate operations to find one single post
            if (posts.length) { // if the found posts array is not empty
                resolve(posts[0]);
            } else{
                console.log("No post found with given id")
                reject();
            }
        });
    }

    static findByAuthorId(authorId) {
        // this method looks in the database for all posts matching an author's id
        return Post.postQuery([
            {$match: {author: authorId}},
            {$sort: {creationDate: -1}} // -1 is descending order
        ]);
        // these are the unique aggregate operations needed for finding posts by an author
    }

    static delete(postId, visitorId) {
        return new Promise(async (resolve, reject) => {
            try {
                let post = await Post.findById(postId, visitorId);
                if (post.visitorIsOwner) {
                    // if visitor is owner he has permission to delete
                    await postsCollection.deleteOne({_id: new ObjectID(postId)});
                    console.log("Succesfully deleted");
                    resolve();
                }else {
                    console.log("Visitor is not owner")
                    reject();
                }
            } catch(error){
                console.log(error)
                reject();
            }
        })
    }

    static search(searchTerm) {
        return new Promise(async (resolve, reject) => {
            if (typeof(searchTerm) == "string"){
                let searchResults = await Post.postQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: "textScore"}}}    // score is how relevant
                ]);
                resolve(searchResults);
            }else {
                reject();
            }
        })
    }

    static countPostsByAuthor(id) { // params: ObjectID
        return new Promise(async (resolve, reject) => {
            let postCount = await postsCollection.countDocuments({author: id})    // author is an ObjectID
            resolve(postCount);
        })
    }

    static async getFeed(id) {

        // first, identify the accounts that the current user is following
        let accountsFollowed = await followsCollection.find({followerId: new ObjectID(id)}).toArray();
            accountsFollowed = accountsFollowed.map((followDoc) => {
                return followDoc.followedId;
            }); // returns array of Id objects of accounts being followed.
        
        return Post.postQuery([     // postquery is itself a Promise
            
            {$match: {author: {$in: accountsFollowed}}},    // find all posts whos author is within out accountsFollowed array
            {$sort: {creationDate: -1}} // sort these posts to be ordered from newest (+) to oldest (-)
        ]);
    }

}

module.exports = Post;