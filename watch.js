chrome.storage.local.get("ohc", function (items) {
  const setting = items.ohc ?? [false, false];

  const isAlwaysActive = setting[0];
  const isProMode = setting[1];

  let isActive = isAlwaysActive;
  let isBtnCreated = false;
  let prevPathName = "";
  let isActiveChanged = false; // pro only
  let isOnObserver = false; // pro only
  let hangulCommentCnt = 0; // normal only
  let isAddedSortEvent = false; // normal only

  const isHangulText = (char) => {
    const c = char.charCodeAt(0);
    return (0x1100 <= c && c <= 0x11ff) || (0x3130 <= c && c <= 0x318f) || (0xac00 <= c && c <= 0xd7a3);
  };

  const delay = (s = 1000) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, s)
    );
  };

  const removeButton = () => {
    const oldBtn = document.getElementById("ohc-button-wrap");
    if (oldBtn) oldBtn.remove();
  };

  const createButton = async (date) => {
    const comment = document.getElementById("comments");
    const commentHeader = document.querySelector("ytd-comments-header-renderer");

    if (comment && commentHeader) {
      removeButton();

      const newBtn = document.createElement("div");
      newBtn.id = "ohc-button-wrap";
      newBtn.style.position = "absolute";
      newBtn.style.right = "0";

      newBtn.innerHTML = `
      <div class="inner-wrap" 
        style="
          color: #065fd4;
          border: 1px solid #3367d6; 
          border-radius: 5px;
          background-color: #fff;
          padding: 3px 5px; 
          font-size: 12px; 
          display: flex; 
          align-items: center; 
          margin-bottom: 3px;           
          ${isAlwaysActive ? "pointer-events: none;" : ""}"
      >
        <label for="ohc-button">한댓</label>
        <input id="ohc-button" type="checkbox" ${isActive || isAlwaysActive ? "checked" : ""} style="${isAlwaysActive ? "opacity: 0.3" : ""}"/>
        ${date ? `<span>${date}</span>` : ``}
      </div>
    `;
      commentHeader.style.position = "relative";
      commentHeader.appendChild(newBtn);

      let ev;
      if (isProMode) {
        ev = () => {
          if (!isActive) {
            setTimeout(() => detect(true), 1000);
            setTimeout(() => detect(true), 2500);
            setTimeout(() => detect(true), 5000);
          }
          isActive = !isActive;
          isActiveChanged = true;
        };
      } else {
        ev = () => {
          isActive = !isActive;
          isActiveChanged = true;
        };
      }

      document.getElementById("ohc-button").addEventListener("click", ev);
    } else {
      await delay();
      createButton();
    }
  };

  const sortButtonClickEvent = async () => {
    const btns = document.querySelectorAll("#sort-menu a");

    if (btns.length) {
      for (const b of btns) {
        b.addEventListener("click", () => {
          if (isActive) {
            if (isProMode) {
              setTimeout(() => detect(true), 1000);
              setTimeout(() => detect(true), 3000);
              setTimeout(() => detect(true), 5000);
            } else {
              setTimeout(() => (hangulCommentCnt = 0), 1000);
              setTimeout(() => (hangulCommentCnt = 0), 3000);
              setTimeout(() => (hangulCommentCnt = 0), 5000);
            }
          }
        });
      }
      isAddedSortEvent = true;
    } else {
      await delay();
      sortButtonClickEvent();
    }
  };

  // pro
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      if (mutation.nextSibling?.nodeName === "#text" && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.id === "content-text" && node.classList?.contains("ytd-comment-renderer")) {
            const comment = node.innerText;
            const commentLength = comment.length;
            const text = comment.substr(0, 6) + comment.substr(commentLength - 6, commentLength - 1);

            let isHangulComment = false;

            for (const c of text) {
              if (isHangulText(c)) {
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
  const observerConfig = { childList: true, subtree: true };

  // normal
  const detect = (isNoSlice) => {
    const list = Array.from(document.querySelectorAll("#content-text.ytd-comment-renderer")).slice(isNoSlice ? 0 : hangulCommentCnt);

    for (const c of list) {
      const comment = c.innerText;
      const commentLength = comment.length;
      const text = comment.substr(0, 6) + comment.substr(commentLength - 6, commentLength - 1);

      let isHangulComment = false;

      for (const t of text) {
        if (isHangulText(t)) {
          isHangulComment = true;
          if (!isNoSlice) hangulCommentCnt++;
          break;
        }
      }

      if (!isHangulComment) c.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
    }
  };

  /****************************************************************************************** */

  const watchInterval = setInterval(
    () => {
      const newPathName = window.location.pathname + window.location.search;
      const isNewPath = prevPathName !== newPathName;
      const isWatch = newPathName.includes("watch");

      if (isNewPath) {
        if (isWatch) {
          isActive = isAlwaysActive;
          hangulCommentCnt = 0;
          createButton();
          sortButtonClickEvent();
        } else {
          removeButton();
        }
      }

      // pro
      if (isProMode && isWatch && (isActiveChanged || isNewPath)) {
        observer.disconnect();

        if (isActive) {
          const target = document.getElementById("comments");
          observer.observe(target, observerConfig);
        }

        if (isActiveChanged) isActiveChanged = false;
      }

      // normal
      if (!isProMode && isActive && isWatch) {
        detect();
      }

      prevPathName = newPathName;
    },
    isProMode ? 2000 : 3000
  );
});
