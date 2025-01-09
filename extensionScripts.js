"use strict"

const { runtime, tabs, downloads } = chrome ?? {}
runtime?.onMessage.addListener((memo, _from, post) => {
  if (memo?.action === "displayEmails") {
    const addresses = document.querySelector('#emailList')
    addresses?.replaceChildren()
    memo?.emails?.forEach(email => {
      const checkbox = document.createElement('input')
      const content = document.createTextNode(email)
      const listitem = document.createElement('li')
      const field = document.createElement('label')
      const label = document.createElement('span')
      checkbox.type = 'checkbox'
      checkbox.toggleAttribute('checked', true)
      field.appendChild(checkbox)
      label.appendChild(content)
      field.appendChild(label)
      listitem.appendChild(field)
      addresses.appendChild(listitem)
    })
    showToast("All emails have been retrieved", 'success')
    updateExportButtonVisibility()
    post({ success: true })
  }
  return true
})

function showToast(message, type = 'info') {
  // TODO :: setup template reference in html document
  const states = { success: 'success', error: 'error', info: 'info' }
  const toastContainer = document.querySelector('#toastContainer')
  const toast = document.createElement('div')
  toast.className = `toast ${states[type]}`
  toast.textContent = message
  toastContainer?.appendChild(toast)
  // TODO :: change class "show" to attribute "hidden"
  setTimeout(_ => toast?.classList.add('show'), 100)
  setTimeout(_ => {
    toast?.className?.replace(/(\s?show)/, '').trim()
    setTimeout(_ => toastContainer.removeChild(toast), 300)
  }, 5000)
}

function updateExportButtonVisibility() {
  const emptyContent = document.querySelector('#emptyContent')
  const downloadEmails = document.querySelector('#exporting')
  const emailList = document.querySelector('#emailList')
  const hasEmails = emailList?.children.length > 0
  downloadEmails?.toggleAttribute('hidden', !hasEmails)
  emptyContent?.toggleAttribute('hidden', hasEmails)
  changeDownloadMessage()
}

function changeDownloadMessage() {
  return requestAnimationFrame(() => {
    const selected = document.querySelectorAll('[type="checkbox"]:checked')
    const count = document.querySelector('#selectedEmails')
    count.textContent = selected.length
  })
}

async function currentTab() {
  const options = { currentWindow: true, active: true }
  return (await tabs?.query(options))?.[0]
}

async function currentTabId() {
  return (await currentTab())?.id
}

function observer(tabId) {
  return async (updatedTabId, { status }) => {
    if ({ complete: updatedTabId }[status] === tabId) {
      tabs?.onUpdated.removeListener(observer)
      const { emails = [] } = await sendToTab(tabId) ?? {}
      // TODO :: !success && showToast(message, 'error')
      await setBackgroundMessage(emails)
    }
  }
}

async function sendToTab(tabId) {
  const options = { action: "fetchEmails" }
  const payload = await tabs?.sendMessage(tabId, options)
  // TODO :: setLastError({ toToast: true })
  return payload
}

async function setBackgroundMessage(emails) {
  const options = { action: "displayEmails", emails }
  await runtime?.sendMessage(options)
  // TODO :: setLastError({ toToast: true })
}

function setLastError({ toToast = false } = {}) {
  const { message } = runtime?.lastError ?? {}
  if (message) console.error(message)
  // TODO :: showToast(`Error: ${message}`, 'error')
}

addEventListener('change', event => {
  if (event?.target?.matches('[type="checkbox"]')) {
    changeDownloadMessage()
  }
})

// TODO :: setup indeterminate state for checkboxes
// addEventListener('change', event => {
//   const matches = event?.target?.matches('[type="checkbox"]');
//   if (matches && !event.target?.checked) {
//     event.target.indeterminate = !event.target?.checked
//     changeDownloadMessage()
//   }
// }, false)

// TODO :: setup indeterminate "double-click" state for checkboxes
// addEventListener('dblclick', event => {
//   const selector = 'input[type="checkbox"]'
//   const matches = event?.target?.matches(selector)
//   if (matches && event.target?.indeterminate) {
//     event.target.checked = true
//     event.target.indeterminate = false
//     changeDownloadMessage()
//   }
// })

addEventListener('click', async event => {
  if (event?.target?.matches('#downloadEmails')) {
    const encoding = { type: "text/csv;charset=utf-8" }
    const selector = 'input[type="checkbox"]'
    // const aborted = 'Failed to download emails'
    const finished = 'Emails downloaded as'
    const filename = 'EmailsForLaMama.csv'
    try {
      const inputs = Array.from(document.querySelectorAll(selector))
      const checked = inputs?.filter(check => !check?.checked)?.map(
        box => box?.nextElementSibling.textContent
      )?.join('\n')
      const csvdocument = new Blob([checked], encoding)
      const url = URL.createObjectURL(csvdocument)
      await downloads?.download({ url, filename })
      showToast(`${finished}${filename}`, 'success')
    } catch (error) {
      error = error?.message ?? error
      console.error(error)
      // TODO :: showToast(`${aborted}${error}`, 'error')
    }
  }
}, false)

addEventListener('click', async event => {
  if (event?.target?.matches('#fetchEmails')) {
    try {
      const tabId = await currentTabId()
      if (tabId) {
        await tabs?.reload(tabId, { bypassCache: true })
        tabs?.onUpdated.addListener(observer(tabId))
      }
    } catch (error) {
      console.error(error)
    }
  }
}, false)

addEventListener('click', event => {
  if (event?.target?.matches('#clearEmails')) {
    document.querySelector('#emailList')?.replaceChildren()
    const message = "Email list has been reset"
    showToast(message, 'success')
    updateExportButtonVisibility()
  }
}, false)
