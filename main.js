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
          // console.log(`Audio track ${audioInputTrack} has ${audioTrackItems.length} items`);
          for (let trackItem of audioTrackItems) {
              const itemStart = await trackItem.getStartTime();
              const itemEnd = await trackItem.getEndTime();
              if (time >= itemStart.seconds && time < itemEnd.seconds) {
                  has_collisions = true;
                  // console.log("COLLISION!!!");
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
    if (await marker.getColorIndex() != 1){
      await insertItem(marker.getStart().seconds, marker.getName(), videoInput-1, audioInput-1);
      project.lockedAccess(() => {
        project.executeTransaction((compoundAction) => {
        const setColorAction = marker.createSetColorByIndexAction(1);
        compoundAction.addAction(setColorAction);
      });
      });
    }

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