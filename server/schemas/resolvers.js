const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    // Logic for Querying the data that we need
    Query: {
        users: async () => {
            return User.find()
                .select('-__v')
        },
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('books')

                return userData;
            }

            throw new AuthenticationError('Not logged in')
        }
    },
    // Logic for the mutations login, addUser, saveBook, and removeBook
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user }
        },

        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, { book }, context) => {
            if (context.user) {
              const user = await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $push: { savedBooks: book } },
                { new: true }
              );
      
              return user;
            }
            throw new AuthenticationError('Not logged in');
          },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const removedBook = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                ).populate('books');

                return removedBook;
            }

            throw new AuthenticationError('You need to be logged in!');
        }

    }
};

module.exports = resolvers;