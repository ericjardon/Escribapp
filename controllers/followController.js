const Follow = require('../models/Follow');

exports.addFollow = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId);
    // req.params is the username specified in URL. visitorId is an always-available variable declared in app.use()
    follow.create().then(() => {
        req.flash("success", `Ahora sigues a ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`));
    }).catch((errors) => {
        errors.forEach((err) => {
            req.flash("errors", err);
            req.session.save(() => res.redirect('/'));
        })
    });
}

exports.removeFollow = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId);
    // req.params is the username specified in URL. visitorId is an always-available variable declared in app.use()
    follow.delete().then(() => {
        req.flash("success", `Has dejado de seguir a ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`));
    }).catch((errors) => {
        errors.forEach((err) => {
            req.flash("errors", err);
            req.session.save(() => res.redirect('/'));
        })
    });
}