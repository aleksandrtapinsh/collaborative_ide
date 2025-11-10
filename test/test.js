import request from "supertest";
import app from "../index.js";

// add routes and pages to this list as they are added to the codebase
// this list will be used for GET page tests
const pages = [
    {route: '/', desc: 'home page'},
    {route: '/login', desc: 'login page'},
    {route: '/signUp', desc: 'sign up page'}
]

const uniquesuffix = Date.now();
const uniqueEmail = `TestUser_${uniquesuffix}@example.com`

// Page Tests
pages.forEach(({route, desc}) => {
    describe(`GET ${route}`, function() {
        it(`should return ${desc}`, function(done) {
            request(app)
            .get(route)
            .expect(200)
            .expect('Content-Type',/html/)
            .end(done)
        })
    })
})

// Attempt to get nonexistent page.
describe('GET /nonexistentpage', function() {
    it('should return a 404 error', function(done) {
        request(app)
        .get('/nonexistentpage')
        .expect(404)
        .expect(res => {
            if(res.body.success !== false) 
                throw new Error('Expected success: false, got '+res.body.success);
            if(res.body.message !== 'Page Not Found') 
                throw new Error('Expected message: Page Not Found, got '+res.body.message);
        })
        .end(done)
    })
})

// Post to Sign Up (Signup Attempt)
describe('POST /signUp', function() {
    it('Valid Input', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: `TestUser_${uniquesuffix}`,
            email: uniqueEmail,
            password: "testpassword"
        })
        .expect('Location', '/')
        .expect(302, done)
    })

    it('Malformed Request 1', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: "theemailgoblintookmyemail",
            password: "help"
        })
        .expect(400,done)
    })

        it('Malformed Request 2', function(done) {
        request(app)
        .post('/signUp')
        .send({
            email: "ihavenousername@email.com",
            password: "hello"
        })
        .expect(400,done)
    })

        it('Malformed Request 3', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: "whereismypassword",
            email: "idonthaveapassword@email.com",
        })
        .expect(400,done)
    })

    it('Registered Email', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: "duplicateuserwithsameemail",
            email: uniqueEmail,
            password: "testpassword"
        })
        .expect(409,done)
    })

    it('Registered Username', function(done) {
        request(app)
        .post('/signUp')
        .send({
            username: `TestUser_${uniquesuffix}`,
            email: "guywhoisntgoodatbeingoriginal@email.com",
            password: "testpassword"
        })
        .expect(409,done)
    })
})


// Post to Login (Login Attempt)
describe('POST /login', function() {
    it('Valid Input', function(done) {
        request(app)
        .post('/login')
        .send({
            email: uniqueEmail,
            password: "testpassword"
        })
        .expect('Location', '/editor')
        .expect(302, done)
    })

    // it('No Email', function(done) {

    // })

    // it('No Password', function(done) {

    // })

    // it('Unregistered Email', function(done) {

    // })

    // it('Incorrect Password', function(done) {

    // })
})

// Attempt to open Editor
describe('GET /editor', function() {
    const agent = request.agent(app);

    before( function(done) {
            agent
            .post('/login')
            .send({
                email: uniqueEmail,
                password: 'testpassword'
            })
            .expect(302)
            .expect('Location', '/editor')
            .end(done);
        })

    it('Authorized route (Should return editor page)', function(done) {
        agent
        .get('/editor')
        .expect(200)
        .expect('Content-Type',/html/)
        .end(done)
    })

    it('Unauthorized (will return to login page)', function(done) {
        request(app)
        .get('/editor')
        .expect(302)
        .expect('Location', '/login')
        .end(done)
    })
})