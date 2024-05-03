// Get the modal
const postModal = document.getElementById("post-modal");

// Get the button that opens the modal
const postModalTrigger = document.getElementById("post-modal-trigger");
// Get the <span> element that closes the modal
const postSpan = document.getElementsByClassName("post-span")[0];
// When the user clicks on the button, open the modal
postModalTrigger.onclick = function () {
  postModal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
postSpan.onclick = function () {
  postModal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    postModal.style.display = "none";
  }
};
