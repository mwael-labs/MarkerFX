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
  
async function insertItem(time, item, videoInputTrack, audioInputTrack) {
    try {
        const project = await app.Project.getActiveProject();
        const rootItem = await project.getRootItem();
        const items = await rootItem.getItems();
  
        let actual_item;
        actual_item = item

        const mainSequence = await project.getActiveSequence();
        const seqEditor = await app.SequenceEditor.getEditor(mainSequence);
        const insertionTime = await app.TickTime.createWithSeconds(Number(time));
        const onlyShiftInputTrack = true; // False = split & shift ALL tracks at insertion point
        var itemToInsert;


        // Specify item to insert
        let availableItems = []
        for (i=0; i<items.length; i++) {
            if (items[i].name == item) {
              availableItems.push(items[i])
            }
        }
        const random = Math.floor(Math.random() * availableItems.length);
        itemToInsert = availableItems[random]

        let has_collisions = false

        do {
          has_collisions = false; // reset
          // Get audio track from the sequence
          const audioTrack = await mainSequence.getAudioTrack(audioInputTrack);
          // Get track items
          const audioTrackItems = await audioTrack.getTrackItems(
              app.Constants.TrackItemType.CLIP,
              false
          );
          for (let trackItem of audioTrackItems) {
              const itemStart = await trackItem.getStartTime();
              const itemEnd = await trackItem.getEndTime();
              if (time >= itemStart.seconds && time < itemEnd.seconds) {
                  has_collisions = true;
                  audioInputTrack++;
                  break; // EXIT once there is collision
              }
          }
        } while (has_collisions);
        do {
          has_collisions = false; // reset
          // Get Video track from the sequence
          const videoTrack = await mainSequence.getVideoTrack(videoInputTrack);
          // Get track items
          const videoTrackItems = await videoTrack.getTrackItems(
              app.Constants.TrackItemType.CLIP,
              false
          );
          // console.log(`Video track ${videoInputTrack} has ${videoTrackItems.length} items`);
          for (let trackItem of videoTrackItems) {
              const itemStart = await trackItem.getStartTime();
              const itemEnd = await trackItem.getEndTime();
              if (time >= itemStart.seconds && time < itemEnd.seconds) {
                  has_collisions = true;
                  // console.log("COLLISION!!!");
                  videoInputTrack++;
                  break; // EXIT once there is collision
              }
          }
        } while (has_collisions);
        
        //Create & Execute the Insertion Action
        project.lockedAccess(() => {
            project.executeTransaction ((compoundAction) => {
                actInsertProjItem = seqEditor.createInsertProjectItemAction(itemToInsert, insertionTime, Number(videoInputTrack), Number(audioInputTrack), onlyShiftInputTrack);
                //                                                           projectItem, time  ,VtrackIndex, AtrackIndex, limitshift
                compoundAction.addAction(actInsertProjItem);
            })
        });
        
    } catch (err) {
        console.error(err);
    }
}


async function index2col(index, addOpacity = false) {
    let color = ''
    switch(index){
        case 0:
            color = '#718637'
            break;
        case 1:
            color = '#802626'
            break;
        case 2:
            color = '#AF8BB1'
            break;
        case 3:
            color = '#E96F24'
            break;
        case 4:
            color = '#D0A12B'
            break;
        case 5:
            color = '#FFFFFF'
            break;
        case 6:
            color = '#428DFC'
            break;
        case 7:
            color = '#19F4D6'
            break;
    }
    if (addOpacity){
        return `${color}4d`
    }
    return color
}

async function set_colors_to_color_divs() {
    for(let i=0; i<=7; i++){
        const color_div = document.getElementById(`color-${i}`);
        let color = ''
        switch(i){
            case 0:
                color = '#718637'
                break;
            case 1:
                color = '#802626'
                break;
            case 2:
                color = '#AF8BB1'
                break;
            case 3:
                color = '#E96F24'
                break;
            case 4:
                color = '#D0A12B'
                break;
            case 5:
                color = '#FFFFFF'
                break;
            case 6:
                color = '#428DFC'
                break;
            case 7:
                color = '#19F4D6'
                break;
        }
        color_div.style.backgroundColor = color
    }
    
    
}

async function assign_click_actions_to_color_divs() {
    for(let i=0; i<=7; i++) {
        const color_div = document.getElementById(`color-${i}`);
        if (color_div) {
            color_div.addEventListener("click", () => open_input(i));
        }
    }
}

const assignInput = document.getElementById("assign-input");
const boxesWithInput = document.getElementById("boxes-with-input");

let activeColorIndex = null;

async function open_input(color_index){
    console.log(`U clicked ${color_index}`);
    activeColorIndex = color_index;
    boxesWithInput.style.backgroundColor = await index2col(color_index, true);
}

assignInput.addEventListener("keydown", (event) => {
    if (event.key === 'Enter' && activeColorIndex != null) {
        const color_label =  document.getElementById(`color-label-${activeColorIndex}`);
        color_label.textContent = assignInput.value;
        assignInput.value = '';
}
});

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
    const i = await marker.getColorIndex()
    await insertItem(marker.getStart().seconds, await document.getElementById(`color-label-${i}`).textContent, videoInput-1, audioInput-1);
    project.lockedAccess(() => {
    project.executeTransaction((compoundAction) => {
    const setColorAction = marker.createSetColorByIndexAction(1);
    compoundAction.addAction(setColorAction);
    });
    });
    }

  }
  catch(err){
    console.error(err)
  }
}


async function help() {
    const dialog = document.querySelector("dialog");
    dialog.uxpShowModal({                     
    title: "How to use the plugin!",           
    resize: "none",                         
    size: { width: 400, height: 300 },       
});
};  

set_colors_to_color_divs()
assign_click_actions_to_color_divs()