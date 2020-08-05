const ObjectID = require('mongodb').ObjectID;
const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
const User = require('./User');

class Follow {
    constructor(userToFollow, followerId){
        this.userToFollow = userToFollow;   // is a username
        this.followerId = followerId;   // is an _id string
        this.errors = [];
    }


    cleanUp() {
        if (typeof(this.userToFollow) != "string") {
            this.userToFollow = "";
        }
    }

    async validate(action) {
        // followed user must exist
        let followedAccount = await usersCollection.findOne({username: this.userToFollow});
        if(followedAccount) {
            this.followedId = followedAccount._id;      // followedAccount is a document, not a User instance
        }else {
            this.errors.push("El usuario a seguir no fue encontrado o no existe.")
        }

        let alreadyFollowing = await followsCollection.findOne({followedId: this.followedId, followerId: new ObjectID(this.followerId)});
        if(action == "create") {
            if(alreadyFollowing) {
                this.errors.push("Ya sigues a este perfil.")
            }
        }
        if(action == "delete") {
            if(!alreadyFollowing) {
                this.errors.push("No puedes dejar de seguir a este perfil. El usuario no es un seguidor.")
            }
        }

        // You can't follow yourself
        if (this.followedId == this.followerId){
            this.errors.push("No puedes seguirte a ti mismo.")
        }
    }

    create() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp();
            await this.validate("create");
            if(!this.errors.length) {
                // ready to store follow in db
                await followsCollection.insertOne({followedId: this.followedId, followerId: new ObjectID(this.followerId)})
                resolve();
            }else {
                reject(this.errors);
            }
        })
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            this.cleanUp();
            await this.validate("delete");
            if(!this.errors.length) {
                // ready to delete follow in db
                await followsCollection.deleteOne({followedId: this.followedId, followerId: new ObjectID(this.followerId)})
                resolve();
            }else {
                reject(this.errors);
            }
        })
    } 

    static async isFollowedBy(profileId, visitorId){        // paramTypes: objectID, string
        let followDoc = await followsCollection.findOne({followedId: profileId, followerId: new ObjectID(visitorId)});
        if (followDoc) {
            return true;
        }else {    
            return false;
        }
    }

    static getFollowersById(id){        // receives an _id object of the profile
        return new Promise(async (resolve, reject) => {
            try {
                console.log("trying to get Followers by Id...")
                let followers = await followsCollection.aggregate([
                    {$match: {followedId: id}},
                    {$lookup: {from: "users", localField: "followerId", foreignField: "_id", as: "userDoc"}},
                    {$project: {    // gives us the chance to spell out what we want to ultimately return
                      username: {$arrayElemAt: ["$userDoc.username",0]},
                      email: {$arrayElemAt: ["$userDoc.email",0]} 
                      // and we leave the password out of it 
                    }}
                ]).toArray();

                followers = followers.map((follower) => {       // recreate the array but with avatar instead of email
                    // instantiate user to populate avatar url
                    let user = new User(follower, true);    // true automatically calculates avatar
                    return {username: follower.username, avatar: user.avatar};
                });
                resolve(followers);
            } catch(error){
                console.log(error);
                reject();
            }
        });
    }

    static getFollowingById(id){        // receives the profile's id object
    // almost the same as getFollowersById
        return new Promise(async (resolve, reject) => {
            try {
                console.log("trying to get Followers by Id...")
                let followings = await followsCollection.aggregate([
                    {$match: {followerId: id}},
                    {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}},   // find all follows whose follower is current profile and pull the followed users.
                    {$project: {    // gives us the chance to spell out what we want to ultimately return
                      username: {$arrayElemAt: ["$userDoc.username",0]},
                      email: {$arrayElemAt: ["$userDoc.email",0]} 
                      // and we leave the password out of it 
                    }}
                ]).toArray();

                followings = followings.map((follower) => {       
                    let user = new User(follower, true);    // true automatically calculates avatar
                    return {username: follower.username, avatar: user.avatar};
                });
                resolve(followings);
            } catch(error){
                console.log(error);
                reject();
            }
        });
    }

    static countFollowersById(id) { // id is an ObjectID
        return new Promise(async (resolve, reject) => {
            let followerCount = await followsCollection.countDocuments({followedId: id});
            resolve(followerCount);
        })
    }

    static countFollowingById(id) { // id is an ObjectID
        return new Promise(async (resolve, reject) => {
            let followingCount = await followsCollection.countDocuments({followerId: id});
            resolve(followingCount);
        })
    }
}

module.exports = Follow