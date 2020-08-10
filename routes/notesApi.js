const express = require('express');
const passport = require('passport');
const boom = require('@hapi/boom');
const moment = require('moment');
const { arrayHasNullOrEmpty, isNullOrEmpty } = require('../helpers');
const Note = require('../models/Note');
const Board = require('../models/Board');
const User = require('../models/User');

//require passport jwt token strategy
require('../utils/auth/strategies/jwt');

function notesApi(app) {
    const router = express.Router();
    app.use('/api/notes', router);

    // api/notes path gets all notes or filter by board id associate to the user for all boards
    router.get('/', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            const notes = await Note.find({ owner: req.user.sub }).exec();

            if (!notes || notes.length === 0) {
                return res.status(200).json({ data: null, error: 'No Content', message: 'Notes not found' });
            }

            await Note.populate(notes, { path: 'board', model: 'Board' });

            return res.status(200).json({ data: { notes }, error: null, message: 'Notes found' });

        } catch (error) {
            console.log(error);
            next(boom.internal());
        }
    });

    // // api/notes/:noteId path gets a single sticky
    router.get('/:noteId', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {

            if (!req.params.noteId) {
                return next(boom.badRequest());
            }
            const { noteId } = req.params;

            const note = await note.findOne({ _id: noteId, owner: req.user.sub }).exec();
            if (!note) {
                return res.status(200).json({ data: null, error: 'No Content', message: 'Note not found' });
            }

            await Note.populate(note, { path: 'owner', model: 'User' });
            await Note.populate(note, { path: 'board', model: 'Board' });

            return res.status(200).json({ data: { note }, error: null, message: 'Note found' });

        } catch (error) {
            next(boom.internal());
        }
    });

    // api/notes/add path add a note to a user and board
    router.post('/add', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            if (!req.body.text || !req.body.boardId) {
                return next(boom.badRequest('Missing text or boardId property'));
            }

            const { text, boardId } = req.body;
            if (arrayHasNullOrEmpty([text, boardId])) {
                return next(boom.badRequest('text or boardId must not be null'));
            }

            //validete if the board exists and the owner is the user
            const validUserBoard = await Board.find({ _id: boardId, owner: req.user.sub }).exec();

            if (!validUserBoard) {
                return next(boom.unauthorized('Unauthorized action'));
            }

            const newNote = await new Note({
                text: text,
                board: boardId,
                owner: req.user.sub,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }).save();


            await Board.update({ _id: boardId }, { $addToSet: { notes: newNote._id } }).exec();
            await User.update({ _id: req.user.sub }, { $addToSet: { notes: newNote._id } }).exec();

            if (!newNote) {
                return next(boom.notImplemented());
            }

            return res.status(201).json({ data: { note: newNote }, error: null, message: 'Note created' });;

        } catch (error) {
            console.log(error);
            next(boom.internal());
        }
    });

    // // api/notes/:noteId path edit a board associate to the user
    router.put('/edit/:noteId', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            if (!req.params.noteId || !req.body.text) {
                return next(boom.badRequest('Missing text property'));
            }
            const { noteId } = req.params;
            const { text } = req.body;

            if (isNullOrEmpty(text)) {
                return next(boom.badRequest('text must not be empty'));
            }

            const notePropertiesToUpdate = {
                text: text,
                updated_at: moment().unix()
            }

            const updatedNote = await Note.updateOne({ _id: noteId, owner: req.user.sub }, notePropertiesToUpdate).exec();
            if (!updatedNote || updatedNote.n < 1) {
                return next(boom.notImplemented());
            }

            const updatedNoteData = await Note.findOne({ _id: noteId, owner: req.user.sub }).exec();
            if (!updatedNoteData) {
                return next(boom.conflict());
            }

            return res.status(200).json({ data: { note: updatedNoteData }, error: null, message: 'Note updated' });

        } catch (error) {
            console.log(error);
            next(boom.internal());
        }
    });

    // api/notes/:noteId path delete a board associate to the user
    router.delete('/delete/:noteId', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            if (!req.params.noteId) {
                return next(boom.badRequest());
            }
            const { noteId } = req.params;

            const deletedNote = await Note.deleteOne({ _id: noteId, owner: req.user.sub }).exec();
            if (deletedNote.deletedCount === 0) {
                return next(boom.conflict('The note cannot be deleted, probably it does not exists'));
            }

            await User.update({ _id: req.user.sub }, { $pull: { notes: noteId } });
            await Board.update({ _id: req.user.sub }, { $pull: { notes: noteId } });

            return res.status(200).json({ data: { note: { _id: noteId } }, error: null, message: 'Note deleted' });
        } catch (error) {
            next(boom.internal());
        }
    });

}

module.exports = notesApi;