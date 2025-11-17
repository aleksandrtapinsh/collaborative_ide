import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const signUp = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password || username === "" || email === "" || password === "") {
        return res.status(400).json({ 
            message: 'Bad request: Username, Email, or Password field was empty or missing.' 
        });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            console.log("Username or email already has a registered account");
            return res.status(409).json({ message: 'Username or email is already in use' });
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username,
            email,
            password: hashedPassword,
            projects: []
        });

        await user.save();
        res.redirect('/');
    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).send();
    }
};

export const login = (req, res, next) => {
    console.log('Login Credentials: ', req.body);
    next();
};

