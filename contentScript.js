"use strict"

chrome.runtime.onMessage.addListener((memo, _from, post) => {
  if (memo.action === "fetchEmails") {
    const emails = queryEmailInDocument()
    notifySidepanel(emails)
    post(getMemo(emails))
  }
  return true
})

function queryEmailInDocument(emails = new Set()) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const anchors = document.body.querySelectorAll('[href^="mailto:"]')
  const address = document.body.innerText.match(emailRegex)
  address?.forEach(extractEmail(emails))
  anchors.forEach(extractMailTo(emails))
  return Array.from(emails)
}

function extractMailTo(emails) {
  return link => {
    const email = link.href.replace('mailto:', '')
    emails.add(email)
  }
}

async function notifySidepanel(emails) {
  const options = { action: "displayEmails", emails }
  await chrome.runtime.sendMessage(options)
}

function extractEmail(emails) {
  return (email) => emails.add(email)
}

function getMemo(emails) {
  const success = emails?.length > 0
  const memo = { emails, success }
  memo.message = !success
    ? "no emails found on page."
    : "emails found!"
  return memo
}
