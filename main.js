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

// Storage functions
function saveColorSlots() {
    try {
        const colorSlots = {};
        for (let i = 0; i <= 7; i++) {
            const label = document.getElementById(`color-label-${i}`);
            colorSlots[i] = label.textContent || '';
        }
        localStorage.setItem('markerFX_colorSlots', JSON.stringify(colorSlots));
        console.log('Color slots saved:', colorSlots);
    } catch (err) {
        console.error('Failed to save color slots:', err);
    }
}

function loadColorSlots() {
    try {
        const data = localStorage.getItem('markerFX_colorSlots');
        if (data) {
            const colorSlots = JSON.parse(data);
            console.log('Color slots loaded:', colorSlots);
            
            // Restore labels
            for (let i = 0; i <= 7; i++) {
                const label = document.getElementById(`color-label-${i}`);
                if (label && colorSlots[i]) {
                    label.textContent = colorSlots[i];
                }
            }
            return colorSlots;
        }
    } catch (err) {
        console.error('Failed to load color slots:', err);
    }
    return {};
}

function clearColorSlots() {
    try {
        localStorage.removeItem('markerFX_colorSlots');
        for (let i = 0; i <= 7; i++) {
            const label = document.getElementById(`color-label-${i}`);
            if (label) {
                label.textContent = '';
            }
        }
        console.log('Color slots cleared');
    } catch (err) {
        console.error('Failed to clear color slots:', err);
    }
}
  
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
          for (let trackItem of videoTrackItems) {
              const itemStart = await trackItem.getStartTime();
              const itemEnd = await trackItem.getEndTime();
              if (time >= itemStart.seconds && time < itemEnd.seconds) {
                  has_collisions = true;
                  videoInputTrack++;
                  break; // EXIT once there is collision
              }
          }
        } while (has_collisions);
        
        //Create & Execute the Insertion Action
        project.lockedAccess(() => {
            project.executeTransaction ((compoundAction) => {
                actInsertProjItem = seqEditor.createInsertProjectItemAction(itemToInsert, insertionTime, Number(videoInputTrack), Number(audioInputTrack), onlyShiftInputTrack);
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
    
    // Pre-fill input with existing value
    const currentLabel = document.getElementById(`color-label-${color_index}`);
    assignInput.value = currentLabel.textContent || '';
    assignInput.focus();
}

assignInput.addEventListener("keydown", (event) => {
    if (event.key === 'Enter' && activeColorIndex != null) {
        const color_label = document.getElementById(`color-label-${activeColorIndex}`);
        color_label.textContent = assignInput.value;
        assignInput.value = '';
        
        // Save to localStorage
        saveColorSlots();
        
        activeColorIndex = null;
        boxesWithInput.style.backgroundColor = '';
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
    const mediaName = document.getElementById(`color-label-${i}`).textContent;
    
    // Skip if no media assigned to this color
    if (!mediaName || mediaName.trim() === '') {
        console.log(`no media assigned to color ${i}`);
        continue;
    }
    
    await insertItem(marker.getStart().seconds, mediaName, videoInput-1, audioInput-1);
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
        size: { width: 600, height: 300 },       
    });
}

function copyToClipboard(text) {
    const clipboard = require("uxp").clipboard;
    clipboard.writeText(text).then(() => {
        console.log("Copied to clipboard: " + text);
        alert("Copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy: " + err);
    });
}

set_colors_to_color_divs();
assign_click_actions_to_color_divs();
loadColorSlots();