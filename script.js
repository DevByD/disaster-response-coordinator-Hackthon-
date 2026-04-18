import { db } from "./firebase.js";

import {
ref,
push,
onChildAdded,
get,
update
}
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

/* -------------------------
DISTANCE FUNCTION
--------------------------*/

function getDistance(lat1,lng1,lat2,lng2){

return Math.sqrt(
Math.pow(lat1-lat2,2) +
Math.pow(lng1-lng2,2)
);

}

/* -------------------------
LOCATION FUNCTION
--------------------------*/

function getLocation(callback){

navigator.geolocation.getCurrentPosition(

position => {

callback(
position.coords.latitude,
position.coords.longitude
);

},

error => {

alert("Please allow location access!");

}

);

}

/* -------------------------
VICTIM FORM
--------------------------*/

const victimForm =
document.getElementById("victimForm");

if (victimForm){

victimForm.addEventListener("submit",
e=>{

e.preventDefault();

const name =
document.getElementById("name").value;

const mobile =
document.getElementById("mobile").value;

const type =
document.getElementById("type").value;

const priority =
document.getElementById("priority").value;

const address =
document.getElementById("address").value;

const description =
document.getElementById("description").value;

getLocation(async (lat,lng)=>{

const newRef =
push(
ref(db,"requests"),
{

name,
mobile,
type,
priority,
address,
description,
lat,
lng,
status:"Searching Volunteer..."

});

/* Assign nearest volunteer */

assignNearestVolunteer(
newRef.key,
lat,
lng
);

alert("Emergency Request Sent 🚨");

victimForm.reset();

});

});

}

/* -------------------------
VOLUNTEER FORM
--------------------------*/

const volunteerForm =
document.getElementById("volunteerForm");

if(volunteerForm){

volunteerForm.addEventListener("submit",
e=>{

e.preventDefault();

const name =
document.getElementById("vname").value;

const mobile =
document.getElementById("mobile").value;

const email =
document.getElementById("email").value;

const skill =
document.getElementById("skill").value;

const shift =
document.getElementById("shift").value;

getLocation((lat,lng)=>{

push(
ref(db,"volunteers"),
{

name,
mobile,
email,
skill,
shift,
lat,
lng,
available:true

});

alert("Volunteer Registered Successfully 🤝");

volunteerForm.reset();

});

});

}

/* -------------------------
SMART ASSIGNMENT
--------------------------*/

async function assignNearestVolunteer(
requestId,
reqLat,
reqLng
){

const volunteersRef =
ref(db,"volunteers");

const snapshot =
await get(volunteersRef);

if(snapshot.exists()){

let nearestVolunteer = null;

let minDistance = Infinity;

snapshot.forEach(child=>{

let volunteer =
child.val();

if(volunteer.available){

let dist =
getDistance(
reqLat,
reqLng,
volunteer.lat,
volunteer.lng
);

if(dist < minDistance){

minDistance = dist;

nearestVolunteer = {
id: child.key,
data: volunteer
};

}

}

});

/* Assign volunteer */

if(nearestVolunteer){

await update(
ref(db,
"requests/"+requestId),
{

status:"Assigned",

assignedVolunteer:
nearestVolunteer.data.name

});

/* Mark volunteer busy */

await update(
ref(db,
"volunteers/"+nearestVolunteer.id),
{

available:false

});

}

else{

/* Retry after 5 sec */

setTimeout(()=>{

assignNearestVolunteer(
requestId,
reqLat,
reqLng
);

},5000);

}

}

}

/* -------------------------
MAP DASHBOARD
--------------------------*/

if(document.getElementById("map")){

var map = L.map('map')
.setView([13.0827,80.2707],10);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
).addTo(map);

/* Requests */

onChildAdded(
ref(db,"requests"),
snapshot=>{

var data =
snapshot.val();

var color="red";

if(data.priority=="Medium")
color="orange";

if(data.priority=="Low")
color="green";

L.circleMarker(
[data.lat,data.lng],
{
color:color,
radius:8
}
)
.addTo(map)
.bindPopup(

"🚨 "+data.type+

"<br>Priority: "+data.priority+

"<br>Status: "+data.status+

"<br>Volunteer: "+
(data.assignedVolunteer || "Searching...")

);

});

/* Volunteers */

onChildAdded(
ref(db,"volunteers"),
snapshot=>{

var data =
snapshot.val();

L.marker(
[data.lat,data.lng]
)
.addTo(map)
.bindPopup(
"🤝 "+data.name+
"<br>Skill: "+data.skill
);

});

}

/* -------------------------
ADMIN PANEL WITH COMPLETE BUTTON
--------------------------*/

const requestsTable =
document.getElementById("requestsTable");

if (requestsTable) {

onChildAdded(
ref(db,"requests"),
snapshot => {

var data = snapshot.val();

var requestId = snapshot.key;

var row =
requestsTable.insertRow(-1);

row.insertCell(0).innerText =
data.name;

row.insertCell(1).innerText =
data.mobile;

row.insertCell(2).innerText =
data.type;

/* Priority */

var priorityCell =
row.insertCell(3);

priorityCell.innerText =
data.priority;

if(data.priority=="High")
priorityCell.className="high";

if(data.priority=="Medium")
priorityCell.className="medium";

if(data.priority=="Low")
priorityCell.className="low";

row.insertCell(4).innerText =
data.address;

var statusCell =
row.insertCell(5);

statusCell.innerText =
data.status;

/* CALL BUTTON */

var callCell =
row.insertCell(6);

callCell.innerHTML =
'<a href="tel:'+
data.mobile+
'"><button class="call-btn">📞 Call</button></a>';

/* COMPLETE BUTTON */

var completeCell =
row.insertCell(7);

completeCell.innerHTML =
'<button class="call-btn" onclick="completeRequest(\''+
requestId+
'\')">✅ Complete</button>';

});

}

/* -------------------------
RESET VOLUNTEERS
--------------------------*/

window.resetVolunteers = async function(){

const volunteersRef =
ref(db,"volunteers");

const snapshot =
await get(volunteersRef);

if(snapshot.exists()){

snapshot.forEach(child=>{

update(
ref(db,
"volunteers/"+child.key),
{

available:true

});

});

alert("All Volunteers Reset to Available ✅");

}

};
/* -------------------------
MARK REQUEST COMPLETE
--------------------------*/

window.completeRequest =
async function(requestId){

const requestRef =
ref(db,"requests/"+requestId);

const snapshot =
await get(requestRef);

if(snapshot.exists()){

const data =
snapshot.val();

/* Update request */

await update(
requestRef,
{

status:"Completed"

});

/* Free volunteer */

if(data.assignedVolunteer){

const volunteersRef =
ref(db,"volunteers");

const volunteerSnap =
await get(volunteersRef);

volunteerSnap.forEach(child=>{

if(child.val().name ==
data.assignedVolunteer){

update(
ref(db,
"volunteers/"+child.key),
{

available:true

});

}

});

}

alert("Request Completed ✅");

}

};
/* -------------------------
DISPLAY VOLUNTEERS IN ADMIN
--------------------------*/

const volunteersTable =
document.getElementById("volunteersTable");

if (volunteersTable) {

onChildAdded(
ref(db,"volunteers"),
(snapshot) => {

var data = snapshot.val();

console.log("Volunteer Loaded:", data);

var row =
volunteersTable.insertRow(-1);

/* Name */

row.insertCell(0).innerText =
data.name || "N/A";

/* Mobile */

row.insertCell(1).innerText =
data.mobile || "N/A";

/* Email */

row.insertCell(2).innerText =
data.email || "N/A";

/* Skill */

row.insertCell(3).innerText =
data.skill || "General";

/* Shift */

row.insertCell(4).innerText =
data.shift || "-";

/* Status */

row.insertCell(5).innerText =
data.available ?
"Available" :
"Busy";

/* Call Button */

var callCell =
row.insertCell(6);

callCell.innerHTML =
'<a href="tel:'+
data.mobile+
'"><button class="call-btn">📞 Call</button></a>';

});

}

/* -------------------------
ANALYTICS SECTION
--------------------------*/

const totalRequests =
document.getElementById("totalRequests");

const totalVolunteers =
document.getElementById("totalVolunteers");

if (totalRequests || totalVolunteers) {

let requestCount = 0;
let volunteerCount = 0;

let food = 0;
let medical = 0;
let rescue = 0;

/* Requests */

onChildAdded(
ref(db,"requests"),(snapshot)=>{

requestCount++;

if(totalRequests)
totalRequests.innerText =
requestCount;

var data = snapshot.val();

if(data.type=="Food") food++;
if(data.type=="Medical") medical++;
if(data.type=="Rescue") rescue++;

updateChart();

});

/* Volunteers */

onChildAdded(
ref(db,"volunteers"),
(snapshot)=>{

volunteerCount++;

if(totalVolunteers)
totalVolunteers.innerText =
volunteerCount;

});

/* Chart */

var ctx =
document.getElementById("requestChart");

if(ctx){

var chart =
new Chart(ctx, {

type: 'pie',

data: {

labels:
['Food','Medical','Rescue'],

datasets: [{

data:
[food,medical,rescue]

}]

}

});

function updateChart(){

chart.data.datasets[0].data =
[food,medical,rescue];

chart.update();

}

}

}