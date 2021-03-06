// You can import your modules
// import index from '../src/index'

import nock from 'nock'
// Requiring our app implementation
import myProbotApp from '../src'
import { Probot } from 'probot'

const btoa = require('btoa')

nock.disableNetConnect()

describe('Autoapproval bot', () => {
  let probot: any

  beforeEach(() => {
    probot = new Probot({})
    // Load our app into probot
    const app = probot.load(myProbotApp)

    // just return a test token
    app.app = () => 'test'
  })

  test('PR has blacklisted labels -> will NOT be approved', async (done) => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels:\n  - merge\nblacklisted_labels:\n  - wip\napply_labels: []')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR has no required labels -> will NOT be approved', async (done) => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels:\n  - ready\nblacklisted_labels: []\napply_labels: []')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR has not all required labels -> will NOT be approved', async (done) => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels:\n  - ready\n  - ready2\nblacklisted_labels: []\napply_labels: []')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR has no expected owner -> will NOT be approved', async (done) => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = btoa('from_owner:\n  - blabla\nrequired_labels:\n  - merge\nblacklisted_labels: []\napply_labels: []')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR has required labels and expected owner -> will be approved', async (done) => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels:\n  - merge\nblacklisted_labels: []\napply_labels: []')
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR has multiple required labels and expected owner -> will be approved', async (done) => {
    const payload = require('./fixtures/pull_request_opened_multiple_labels.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels:\n  - merge\n  - merge2\nblacklisted_labels: []\napply_labels: []')
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR has one of multiple required labels and expected owner -> will be approved', async (done) => {
    const payload = require('./fixtures/pull_request_opened_multiple_labels.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels:\n  - merge\n  - merge2\nrequired_labels_mode: one_of\nblacklisted_labels: []\napply_labels: []')
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR approved and label is applied', async (done) => {
    const payload = require('./fixtures/pull_request.opened.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels: []\nblacklisted_labels: []\napply_labels:\n  - done')
    const reviews = require('./fixtures/pull_request_reviews_empty.json')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/issues/1/labels', (body: any) => {
        return body.includes('done')
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload })
    done()
    nock.cleanAll()
  })

  test('PR is already approved -> will not be approved again', async (done) => {
    const payload = require('./fixtures/pull_request_review.dismissed.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels: []\nblacklisted_labels: []\napply_labels:\n  - merge')
    const reviews = require('./fixtures/pull_request_reviews.json')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request_review.dismissed', payload })
    done()
    nock.cleanAll()
  })

  test('Autoapproval review was dismissed -> approve PR again', async (done) => {
    const payload = require('./fixtures/pull_request_review.dismissed.json')
    const config = btoa('from_owner:\n  - dkhmelenko\nrequired_labels: []\nblacklisted_labels: []\napply_labels:\n  - merge')
    const reviews = require('./fixtures/pull_request_reviews.json')

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/contents/.github/autoapproval.yml')
      .reply(200, { content: config })

    nock('https://api.github.com')
      .get('/repos/dkhmelenko/autoapproval/pulls/1/reviews')
      .reply(200, reviews)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/pulls/1/reviews', (body: any) => {
        return body.event === 'APPROVE'
      })
      .reply(200)

    nock('https://api.github.com')
      .post('/repos/dkhmelenko/autoapproval/issues/1/labels', (body: any) => {
        return body.includes('merge')
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'pull_request_review.dismissed', payload })
    done()
    nock.cleanAll()
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
