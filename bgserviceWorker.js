"use strict"

const { runtime, action, sidePanel } = chrome ?? {}
runtime?.onMessage.addListener(_ => true)
action?.onClicked.addListener(async tab => {
  try {
    await prepareSidePanel(tab.id)
    await useIconToOpenSidePanel()
  } catch (message) {
    console.error(message)
  }
  return true
})

async function prepareSidePanel(tabId) {
  const options = { path: 'extensionPanel.html', tabId }
  await sidePanel?.setOptions(options)
  getLastError()
}

async function useIconToOpenSidePanel() {
  const options = { openPanelOnActionClick: true }
  await sidePanel?.setPanelBehavior(options)
  getLastError()
}

function getLastError() {
  const error = runtime?.lastError
  if (error) throw error?.message
}