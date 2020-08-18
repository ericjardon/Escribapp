// Rememeber Controller's functions have to have req, res as parameters and be module exports.
const Post = require('../models/Post');


exports.viewCreateScreen = function(req, res) {
    res.render('create-post');
}

exports.submitPost = function(req, res) {
    let post = new Post(req.body, req.session.user._id);  // re.body contains the submitted data, req.session contains the user session data
    console.log(req.body.title + " " + req.body.body)
    post.create().then(function(newPostId) {
        req.flash("success", "Tu post fue creado exitosamente.");
        req.session.save(() => res.redirect(`post/${newPostId}`))
    }).catch(function(errors) { // errors is brought in automatically by create().
        console.log("algo valió, " + errors)
        errors.forEach(error => req.flash("errors", error));
        req.session.save(() => res.redirect("/"));
    });
}

exports.apiSubmitPost = function(req, res) {
    let post = new Post(req.body, req.apiUser._id); 
    console.log(req.body.title + ", " + req.body.body)
    post.create().then(function(newPostId) {
        res.json("Creación exitosa");
    }).catch(function(errors) { 
        res.json(errors)
    });
}

exports.viewSingle = async function(req, res){
    try {
        let singlePost = await Post.findById(req.params.id, req.visitorId);
        res.render('single-post-screen', {post: singlePost, title: singlePost.title}); // the post variable is the document found by the database and sent to us by resolve(post)
    }catch {
        res.render('404');
    };
}

exports.viewEditScreen = async function(req, res){
    try {
        let singlePost = await Post.findById(req.params.id, req.visitorId);
        if (singlePost.visitorIsOwner) {
            res.render('edit-post', {post: singlePost});
        } else {
            req.flash("errors", "No es posible completar la acción: usuario no tiene permisos.")
            req.session.save(() => res.redirect('/'));
        }
    } catch {
        res.render('404');
    }  
}

exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id);    // the form input, the visitors id, and the post id
    post.update().then((status) =>{
        // either post was succesfully updated, else there have been validation errors during edit
        if (status=="success"){
            req.flash("success", "Los cambios se guardaron exitosamente.");
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}`);
            })
        }else{
            // show red error rectangles with validation messages
            post.errors.forEach(function(error){
                req.flash("errors", error);
            });
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`);    // redirected to same edit screen of the intended post
            })
        }
    }).catch(() => {
       // rejects if post does not exist or if current visitor is not Owner
       req.flash("errors", "No es posible completar la acción: usuario no tiene permisos.");
       req.session.save(function(){
           res.redirect("/");   // homepage ya incluye funcionalidad de mostrar flash messages
       })
    });
}

exports.delete = function(req, res) {
    Post.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success", "El post fue borrado con éxito.");
        req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    }).catch(() => {
        req.flash("errors", "No es posible completar la acción: usuario no tiene permisos.");
        req.session.save(() => res.redirect('/')); 
    });
}

exports.apiDelete = function(req, res) {
    Post.delete(req.params.id, req.apiUser._id).then(() => {
        res.json("Éxito al borrar post")
    }).catch(() => {
        res.json("Error: usuario no cuenta con los permisos para realizar esa acción.")
    });
}

exports.search = function(req, res) {
    Post.search(req.body.searchTerm).then(posts => {    // posts is search results
        res.json(posts);
    }).catch(() => {
        res.json([]);
    });
}