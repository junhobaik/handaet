chrome.storage.local.get("ohc", function (items) {
  const setting = items.ohc ?? [false, false];

  const isAlwaysActive = setting[0]; // popup setting
  const isProMode = setting[1]; // popup setting
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
      // btn.style.display = "flex";
      btn.style.position = "relative";
      btn.style.minHeight = "24px";
      // btn.style.justifyContent = "flex-end";

      btn.innerHTML = `
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
            position: absolute; 
            bottom: 10px; 
            right: 0; 
            ${isAlwaysActive ? "pointer-events: none;" : ""}"
        >
          <span>한글 댓글만</span>
          <input id="ohc-button" type="checkbox" ${isActive || isAlwaysActive ? "checked" : ""} style="${isAlwaysActive ? "opacity: 0.3" : ""}"/>
        </div>
      `;
      document.getElementById("meta").appendChild(btn);

      let ev;
      if (isProMode) {
        ev = () => {
          if (!isActive) {
            setTimeout(() => {
              const list = Array.from(document.querySelectorAll("#content-text.ytd-comment-renderer"));
              for (const c of list) {
                const text = c.innerText.substr(0, 6);
                let isHangulComment = false;
                for (const t of text) {
                  if (isHangulText(t)) {
                    isHangulComment = true;
                    break;
                  }
                }
                if (!isHangulComment) c.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
              }
            }, 3000);
          }
          isActive = !isActive;
        };
      } else {
        ev = () => {
          isActive = !isActive;
        };
      }

      document.getElementById("ohc-button").addEventListener("click", ev);

      createButton();
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

    const config = { childList: true, subtree: true };

    const watchInterval = setInterval(() => {
      const newPathName = window.location.pathname + window.location.search;

      if (newPathName !== pathName) {
        isBtnCreated = false;
        isAddedSortEvent = false;

        if (newPathName.includes("watch")) {
          if (!isBtnCreated) createButton();
          if (!isAddedSortEvent) sortButtonClickEvent();

          const target = document.getElementById("comments");

          if (isActive && target) {
            observer.disconnect();
            observer.observe(target, config);
            pathName = newPathName;
          }
        } else {
          observer.disconnect();
          pathName = newPathName;
        }
      }
    }, 3000);
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
    }, 3000);
  }
});
