// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

function runPlugin() {
  const selections = figma.currentPage.selection
  if (selections.length === 0) {
    figma.ui.postMessage({
      type: "placeholder",
    })
    return
  }
  if (selections.length === 1) {
    const selection = selections[0]
    if (selection.type !== "FRAME") {
      console.log("has selected a node")
      const parentFrame = getFrameFromNode(selection) 
      console.log("found parent frame")
      console.log(parentFrame)
      if (parentFrame === null) {
        figma.ui.postMessage({
          type: "placeholder",
        })
        return
      }
      const transitions = parentFrame.getPluginData("transitions")
      figma.ui.postMessage({
        type: "transitions",
        frameName: parentFrame.name,
        frameId: parentFrame.id,
        nodeNames: transitions ? JSON.parse(transitions) : [],
        newNodeName: selection.name
      })
    }
  }
  if (selections.some(s => s.type !== "FRAME")) {
    return
  }

  // if all selections are frames, then show "run" button
  console.log("all selections are frames")
  figma.ui.postMessage({
    type: "can_run", 
  })
}

figma.on("run", () => {
  runPlugin()
})

figma.on("selectionchange", () => {
  runPlugin()
})

function executeCopy() {

}

function getFrameFromNode(node: SceneNode): FrameNode | null {
  if (node.type === "FRAME") {
    return node
  }
  if (node.parent && node.parent.type) {
    return getFrameFromNode(node.parent as SceneNode)
  }
  return null
}


// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  if (msg.type === 'added-transition') {
    const frame = figma.getNodeById(msg.frameId)
    if (!frame) {
      return
    }
    frame.setPluginData("transitions", JSON.stringify(msg.nodeNames))
  }

  if (msg.type === 'run') {
    const selections = figma.currentPage.selection
    if (selections.some(s => s.type !== "FRAME")) {
      return
    }


    let counter = 0

    for (let i = 0; i < selections.length; i++) {
      const frame = selections[i] as FrameNode
      const transitionsData = frame.getPluginData("transitions")
      const transitions = transitionsData ? JSON.parse(transitionsData) : []
      transitions.push("hopefullyneverfoundnameinfigma") // TODO: fix. very hacky

      for (let j = 0; j < transitions.length; j++) {
        const clone = frame.clone()
        for (let k = j; k < transitions.length; k++) {
          const transition = transitions[k]
          const node = clone.findOne(n => n.name === transition)
          node?.remove()
        }
        
        clone.x = selections[0].x + (counter * (100 + selections[0].width))
        clone.y = selections[0].y + (selections[0].height + 100)
  
        clone.setPluginData("transitions", "[]")
        counter += 1
      }
    }
  }




  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.

  // figma.closePlugin();
};
