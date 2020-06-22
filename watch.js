const isProMode = false; // popup setting
const isAlwaysActive = false; // popup setting
let isActive = isAlwaysActive ?? false;
let isBtnCreated = false;
let isAddedSortEvent = false;
let hangulCommentCnt = 0; // normal only
let pathName;

const isHangulText = (char) => {
  const c = char.charCodeAt(0);
  return (0x1100 <= c && c <= 0x11ff) || (0x3130 <= c && c <= 0x318f) || (0xac00 <= c && c <= 0xd7a3);
};

const createButton = () => {
  if (document.getElementById("ohc-button")) {
    isBtnCreated = true;
  } else {
    const btn = document.createElement("div");
    btn.style.position = "relative";

    btn.innerHTML = `
      <div class="inner-wrap" style="display: flex; align-items: center; position: absolute; bottom: 0; right: 0; ${isAlwaysActive ? "pointer-events: none;" : ""}">
        <span>한글 댓글만</span>
        <input id="ohc-button" type="checkbox" ${isActive ? "checked" : ""} style="${isAlwaysActive ? "opacity: 0.3" : ""}"/>
      </div>
    `;
    document.getElementById("merch-shelf").appendChild(btn);
    document.getElementById("ohc-button").addEventListener("click", () => {
      isActive = !isActive;
    });
  }
};

const sortButtonClickEvent = () => {
  const btns = document.querySelectorAll("#sort-menu a");

  if (btns.length) {
    for (const b of btns) {
      b.addEventListener("click", () => {
        setTimeout(() => {
          hangulCommentCnt = 0;
        }, 3000);
      });
    }
    isAddedSortEvent = true;
  }
};

if (isProMode) {
  // Pro Mode

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      if (mutation.nextSibling?.nodeName === "#text" && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.id === "content-text" && node.classList?.contains("ytd-comment-renderer")) {
            const comment = node.innerText.substr(0, 6);

            let isHangulComment = false;

            for (const c of comment) {
              if (hangulText(c)) {
                isHangulComment = true;
                break;
              }
            }

            if (!isHangulComment) node.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.display = "none";
          }
        }
      }
    });
  });

  const config = { childList: true, subtree: true };

  const watchInterval = setInterval(() => {
    if (isActive) {
      const newPathName = window.location.pathname + window.location.search;

      if (newPathName !== pathName) {
        isAddedSortEvent = false;
        isBtnCreated = false;

        if (newPathName.indexOf("watch") !== -1) {
          if (!isBtnCreated) createButton();
          if (!isAddedSortEvent) sortButtonClickEvent();
          const target = document.getElementById("comments");

          if (target) {
            observer.disconnect();
            observer.observe(target, config);
            pathName = newPathName;
          }
        } else {
          observer.disconnect();
          pathName = newPathName;
        }
      }
    }
  }, 5000);
} else {
  // Normal Mode

  let isDetecting = false;

  const detect = () => {
    isDetecting = true;
    const list = Array.from(document.querySelectorAll("#content-text.ytd-comment-renderer")).slice(hangulCommentCnt);

    for (const c of list) {
      const text = c.innerText.substr(0, 6);
      let isHangulComment = false;

      for (const t of text) {
        if (isHangulText(t)) {
          isHangulComment = true;
          hangulCommentCnt++;
          break;
        }
      }

      if (!isHangulComment) c.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
    }
    isDetecting = false;
  };

  setInterval(() => {
    const newPathName = window.location.pathname + window.location.search;

    if (newPathName !== pathName) {
      isAddedSortEvent = false;
      isBtnCreated = false;
      hangulCommentCnt = 0;
    }
    if (newPathName.includes("watch") && !isDetecting) {
      if (!isAddedSortEvent) sortButtonClickEvent();
      if (!isBtnCreated) createButton();
      if (isActive) detect();
    }
  }, 2500);
}
