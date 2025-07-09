export default function onTyping(user) {
  const typingIndicator = document.getElementById("typingIndicator");
  typingIndicator.innerText = `${user} is typing...`;
}
