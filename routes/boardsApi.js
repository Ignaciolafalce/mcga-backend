const express = require('express');
const passport = require('passport');
const boom = require('@hapi/boom');
const { arrayHasNullOrEmpty, isNullOrEmpty } = require('../helpers');
const moment = require('moment');
const Board = require('../models/Board');
const User = require('../models/User');
const Note = require('../models/Note');

//require passport jwt token strategy
require('../utils/auth/strategies/jwt');

function boardsApi(app) {
    const router = express.Router();
    app.use('/api/boards', router);

    // api/boards path gets all boards associate to the user
    router.get('/', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            const boards = await Board.find({ owner: req.user.sub }).exec();
            if (!boards) {
                return res.status(200).json({ data: null, error: 'No Content', message: 'Boards not found' });
            }

            return res.status(200).json({ data: { boards: boards }, error: null, message: 'Boards found' });

        } catch (error) {
            next(boom.internal());
        }
    });

    // api/boards/:boardId path gets a single board by board id
    router.get('/:boardId', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {

            if (!req.params.boardId) {
                return next(boom.badRequest());
            }
            const { boardId } = req.params;

            const board = await Board.findOne({ _id: boardId, owner: req.user.sub }).exec();

            if (!board) {
                return res.status(200).json({ data: null, error: 'No Content', message: 'Board not found' });
            }

            // await Board.populate(board, { path: 'owner', model: 'User' });
            await Board.populate(board, { path: 'notes', model: 'Note' });

            return res.status(200).json({ data: { board }, error: null, message: 'Board found' });

        } catch (error) {
            next(boom.internal());
        }
    });

    // api/boards/:boardId path add a board associate to the user
    router.post('/add', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            if (!req.body.name) {
                return next(boom.badRequest('Missing name propery'));
            }
            const { name } = req.body;

            if (isNullOrEmpty(name)) {
                return next(boom.badRequest('name must not be empty'));
            }

            const boardNameExist = await Board.findOne({ owner: req.user.sub, name: name }).exec();
            if (boardNameExist) {
                return next(boom.conflict('A board with that name alredy exists'));
            }

            const newBoard = await new Board({
                name: name,
                owner: req.user.sub,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }).save();

            if (!newBoard) {
                return newx(boom.notImplemented());
            }

            await User.update({ _id: req.user.sub }, { $addToSet: { boards: newBoard._id } }).exec();

            return res.status(201).json({ data: { board: newBoard }, error: null, message: 'Board created' });

        } catch (error) {
            console.log(error);
            next(boom.internal());
        }
    });

    // api/boards/:boardId path edit a board associate to the user
    router.put('/edit/:boardId', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            if (!req.params.boardId || !req.body.name) {
                return next(boom.badRequest('Missing name property'));
            }
            const { boardId } = req.params;
            const { name } = req.body;

            if (isNullOrEmpty(name)) {
                return next(boom.badRequest('name must not be empty'));
            }

            const boardPropertiesToUpdate = {
                name: name,
                updated_at: moment().unix()
            }

            const updatedBoard = await Board.updateOne({ _id: boardId, owner: req.user.sub }, boardPropertiesToUpdate).exec();

            if (!updatedBoard || updatedBoard.n < 1) {
                return next(boom.notImplemented("Bad implementation"));
            }

            const updatedBoardData = await Board.findOne({ _id: boardId, owner: req.user.sub }).exec();
            if (!updatedBoardData) {
                return next(boom.conflict("Something went wrong"));
            }
            return res.status(200).json({ data: { board: updatedBoardData }, error: null, message: 'Board updated' });

        } catch (error) {
            console.log(error);
            next(boom.internal());
        }
    });

    // api/boards/:boardId path delete a board associate to the user
    router.delete('/delete/:boardId', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        try {
            if (!req.params.boardId) {
                return next(boom.badRequest());
            }
            const { boardId } = req.params;

            const deletedBoard = await Board.deleteOne({ _id: boardId, owner: req.user.sub }).exec();
            if (deletedBoard.deletedCount === 0) {
                return next(boom.conflict('The board cannot be deleted, probably it does not exists'));
            }

            //how to pull all notes from user easily?
            await Note.deleteMany({ board: boardId, owner: req.user.sub });
            await User.update({ _id: req.user.sub }, { $pull: { boards: boardId } });

            return res.status(200).json({ data: { board: { _id: boardId } }, error: null, message: 'Board deleted' });
        } catch (error) {
            next(boom.internal());
        }
    });

}

module.exports = boardsApi;