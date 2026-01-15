/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2025 Adobe
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it. If you have received this file from a source other than Adobe,
 * then your use, modification, or distribution of it requires the prior
 * written permission of Adobe.
 **************************************************************************/

// Global object.
const ppro = require("premierepro");
const app = require("premierepro");

// Call the Premiere Pro API to populate Application Info area.
// async function populateProjectInfo() {
//   // Get the active project.
//   const project = await ppro.Project.getActiveProject();
//   if (!project) {
//     log("There is no active project found", "red");
//   } else {
//     log(`Active project: ${project.name}`);
//     // Get the active sequence.
//     const sequence = await project.getActiveSequence();
//     if (!sequence) {
//       log("There is no active sequence found", "red");
//     } else {
//       log(`Active sequence: ${sequence.name}`);
//     }
//   }
// }

// Event listener for the Populate Application Info button.
// document
//   .querySelector("#btnPopulate")
//   .addEventListener("click", populateProjectInfo);

// Event listener for the Clear Application Info button.
// document.querySelector("#clear-btn").addEventListener("click", () => {
//   document.getElementById("plugin-body").innerHTML = "";
// });

// Log function to display messages in the plugin body.
// function log(msg, color) {
//   document.getElementById("plugin-body").innerHTML += color
//     ? `<span style='color:${color}'>${msg}</span><br />`
//     : `${msg}<br />`;
// }


function updateTheme(theme) {
  panelBody = document.getElementById("plugin-body");
  panelHeading = document.getElementById("plugin-heading"); 
  if(theme.includes("dark")) {
    panelBody.style.color = "#fff";
    panelHeading.style.color = "#fff";
  } else {
    panelBody.style.color = "#000";
    panelHeading.style.color = "#000";
  }
}

document.theme.onUpdated.addListener((theme) => {
	updateTheme(theme);
})

const currentTheme = document.theme.getCurrent();
updateTheme(currentTheme);

// let timeToInsert = document.getElementById("input").value;
// Insert a specified item into the main timeline
async function insertItem(time, item, videoInputTrack, audioInputTrack) {
    
    try {
        const project = await app.Project.getActiveProject();
        const rootItem = await project.getRootItem();
        const items = await rootItem.getItems();
        const mainSequence = await project.getActiveSequence();
        const seqEditor = await app.SequenceEditor.getEditor(mainSequence);
        const insertionTime = await app.TickTime.createWithSeconds(Number(time));
        const onlyShiftInputTrack = true; // False = split & shift ALL tracks at insertion point
        var itemToInsert;

        // Specify item to insert
        for (i=0; i<items.length; i++) {
            if (items[i].name == item) {
                itemToInsert = items[i];
                break;
            }
        }

        // Create & Execute the Insertion Action
        project.lockedAccess(() => {
            project.executeTransaction ((compoundAction) => {
                actInsertProjItem = seqEditor.createInsertProjectItemAction(itemToInsert, insertionTime, videoInputTrack, audioInputTrack, onlyShiftInputTrack);
                //                                                           projectItem, time  ,VtrackIndex, AtrackIndex, limitshift
                compoundAction.addAction(actInsertProjItem);
            })
        });
        
    } catch (err) {
        console.error(err);
    }
}


async function getMarkers() {
 
  try{
  const project = await app.Project.getActiveProject();
  const mainSequence = await project.getActiveSequence();
  const sequenceMarkers = await ppro.Markers.getMarkers(mainSequence);
  // MARKERS
  const markers = await sequenceMarkers.getMarkers();
  const videoInput = Number(document.getElementById("videoInput").value)
  const audioInput = Number(document.getElementById("audioInput").value)
  for(let marker of markers){
    await insertItem(marker.getStart().seconds, marker.getName(), videoInput-1, audioInput-1);
  }

  }
  catch(err){
    console.error(err)
  }
}



document.querySelector("#btnPopulate").addEventListener("click", insertItem);