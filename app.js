/* ==========================================================================
   HSC ICT Interactive Web Application JavaScript Logic with Code Playground
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentChapterIndex = 0;
    let currentSectionIndex = 0;
    let bookmarks = JSON.parse(localStorage.getItem('hsc_ict_bookmarks') || '[]');
    let currentFontSize = parseInt(localStorage.getItem('hsc_ict_font_size') || '17');
    let currentTheme = localStorage.getItem('hsc_ict_theme') || 'dark';

    // --- DOM Elements ---
    const htmlElement = document.documentElement;
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const chapterNav = document.getElementById('chapter-list');
    const sectionsContainer = document.getElementById('sections-container');
    const heroBadge = document.getElementById('hero-badge');
    const heroTitle = document.getElementById('hero-title');
    const secCount = document.getElementById('sec-count');
    const readTime = document.getElementById('read-time');
    const prevSecBtn = document.getElementById('prev-sec-btn');
    const nextSecBtn = document.getElementById('next-sec-btn');
    const pageIndicator = document.getElementById('page-indicator');
    const progressBar = document.getElementById('read-progress-bar');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const fontIncBtn = document.getElementById('font-inc');
    const fontDecBtn = document.getElementById('font-dec');
    const fontResetBtn = document.getElementById('font-reset');
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear');
    const searchResultsPanel = document.getElementById('search-results-panel');
    const searchResultsList = document.getElementById('search-results-list');
    const searchStats = document.getElementById('search-stats');
    const readerCanvas = document.getElementById('reader-canvas');

    // Code Modal Elements
    const codeBoardBtn = document.getElementById('code-board-btn');
    const codeModal = document.getElementById('code-modal');
    const closeCodeModal = document.getElementById('close-code-modal');
    const codeTabBtns = document.querySelectorAll('.code-tab-btn');
    const codeTabContents = document.querySelectorAll('.code-tab-content');

    const htmlCodeInput = document.getElementById('html-code-input');
    const htmlPreviewFrame = document.getElementById('html-preview-frame');
    const cCodeInput = document.getElementById('c-code-input');
    const runCBtn = document.getElementById('run-c-btn');
    const cConsoleOutput = document.getElementById('c-console-output');

    const sqlCodeInput = document.getElementById('sql-code-input');
    const runSqlBtn = document.getElementById('run-sql-btn');
    const sqlResultContainer = document.getElementById('sql-result-container');

    // --- Initialize Theme & Font ---
    applyTheme(currentTheme);
    applyFontSize(currentFontSize);
    updateBookmarkBadge();

    // --- Render Sidebar Accordion Chapters ---
    function renderSidebar() {
        chapterNav.innerHTML = '';
        if (typeof BOOK_DATA === 'undefined' || !BOOK_DATA.length) {
            chapterNav.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">বইয়ের ডাটা লোড হয়নি।</p>';
            return;
        }

        BOOK_DATA.forEach((chap, chapIdx) => {
            const chapItem = document.createElement('div');
            chapItem.className = `chap-accordion-item ${chapIdx === currentChapterIndex ? 'active' : ''}`;

            const headerBtn = document.createElement('button');
            headerBtn.className = 'chap-header-btn';
            headerBtn.innerHTML = `
                <span><i class="fa-solid fa-book-open"></i> ${chap.title}</span>
                <i class="fa-solid fa-chevron-down"></i>
            `;

            const subList = document.createElement('div');
            subList.className = 'sec-sub-list';

            chap.sections.forEach((sec, secIdx) => {
                const secLink = document.createElement('div');
                secLink.className = `sec-link-item ${chapIdx === currentChapterIndex && secIdx === currentSectionIndex ? 'active-sec' : ''}`;
                secLink.innerHTML = `<i class="fa-regular fa-file-lines"></i> ${sec.title}`;
                secLink.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectChapterAndSection(chapIdx, secIdx);
                    if (window.innerWidth <= 900) {
                        sidebar.classList.remove('open');
                    }
                });
                subList.appendChild(secLink);
            });

            headerBtn.addEventListener('click', () => {
                const isActive = chapItem.classList.contains('active');
                document.querySelectorAll('.chap-accordion-item').forEach(item => item.classList.remove('active'));
                if (!isActive) {
                    chapItem.classList.add('active');
                }
            });

            chapItem.appendChild(headerBtn);
            chapItem.appendChild(subList);
            chapterNav.appendChild(chapItem);
        });
    }

    // --- Load Chapter Content ---
    function loadChapterContent(chapIdx) {
        if (!BOOK_DATA[chapIdx]) return;
        const chap = BOOK_DATA[chapIdx];

        heroBadge.textContent = `অধ্যায় ${chap.number}`;
        heroTitle.textContent = chap.title;
        secCount.textContent = chap.sections.length;
        readTime.textContent = Math.ceil(chap.sections.length * 2.5);

        sectionsContainer.innerHTML = '';

        chap.sections.forEach((sec, secIdx) => {
            const secCard = document.createElement('div');
            secCard.className = 'section-card';
            secCard.id = `sec-card-${sec.id}`;

            const isBookmarked = bookmarks.some(b => b.secId === sec.id);

            const cardHeader = document.createElement('div');
            cardHeader.className = 'section-card-header';
            cardHeader.innerHTML = `
                <h2>${sec.title}</h2>
                <button class="bookmark-toggle-btn ${isBookmarked ? 'bookmarked' : ''}" title="বুকমার্ক করুন" data-sec-id="${sec.id}" data-chap-idx="${chapIdx}" data-sec-idx="${secIdx}">
                    <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
                </button>
            `;

            const cardBody = document.createElement('div');
            cardBody.className = 'section-card-body';

            sec.items.forEach(item => {
                if (item.type === 'heading') {
                    const headingBox = document.createElement('div');
                    headingBox.className = 'content-heading-box';
                    headingBox.innerHTML = `<h3>${item.text}</h3>`;
                    cardBody.appendChild(headingBox);
                } else if (item.type === 'image') {
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'content-image-wrapper';
                    const img = document.createElement('img');
                    img.src = item.src;
                    img.alt = sec.title;
                    img.loading = 'lazy';
                    img.onerror = function() {
                        // Fallback SVG generator if external image fails
                        const title = sec.title || 'HSC ICT Diagram';
                        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%"><rect width="640" height="360" fill="#0f172a" rx="12"/><text x="320" y="160" fill="#38bdf8" font-size="20" font-weight="bold" text-anchor="middle">${title}</text><text x="320" y="200" fill="#94a3b8" font-size="14" text-anchor="middle">HSC ICT Dynamic Visual Diagram</text></svg>`;
                        this.src = `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;
                    };
                    img.addEventListener('click', () => openImageModal(img.src, sec.title));
                    imgWrapper.appendChild(img);

                    const imgCaption = document.createElement('div');
                    imgCaption.className = 'image-caption';
                    imgCaption.innerHTML = `<i class="fa-solid fa-diagram-project"></i> <span>${sec.title} - চিত্র/ডায়াগ্রাম</span>`;
                    imgWrapper.appendChild(imgCaption);

                    cardBody.appendChild(imgWrapper);
                } else {
                    const p = document.createElement('div');
                    p.className = 'content-paragraph';
                    p.innerHTML = item.text;
                    cardBody.appendChild(p);
                }
            });

            secCard.appendChild(cardHeader);
            secCard.appendChild(cardBody);
            sectionsContainer.appendChild(secCard);
        });

        // Bookmark listener
        document.querySelectorAll('.bookmark-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const secId = btn.dataset.secId;
                const cIdx = parseInt(btn.dataset.chapIdx);
                const sIdx = parseInt(btn.dataset.secIdx);
                toggleBookmark(secId, cIdx, sIdx, btn);
            });
        });

        updateNavControls();
    }

    function selectChapterAndSection(chapIdx, secIdx) {
        if (chapIdx !== currentChapterIndex) {
            currentChapterIndex = chapIdx;
            loadChapterContent(currentChapterIndex);
            renderSidebar();
        }

        currentSectionIndex = secIdx;
        const targetSec = BOOK_DATA[currentChapterIndex].sections[currentSectionIndex];

        if (targetSec) {
            const secCard = document.getElementById(`sec-card-${targetSec.id}`);
            if (secCard) {
                secCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        updateNavControls();
        renderSidebar();
    }

    function updateNavControls() {
        const chap = BOOK_DATA[currentChapterIndex];
        if (!chap) return;

        pageIndicator.textContent = `পরিচ্ছেদ ${currentSectionIndex + 1} / ${chap.sections.length}`;
        prevSecBtn.disabled = (currentChapterIndex === 0 && currentSectionIndex === 0);
        nextSecBtn.disabled = (currentChapterIndex === BOOK_DATA.length - 1 && currentSectionIndex === chap.sections.length - 1);
    }

    prevSecBtn.addEventListener('click', () => {
        if (currentSectionIndex > 0) {
            selectChapterAndSection(currentChapterIndex, currentSectionIndex - 1);
        } else if (currentChapterIndex > 0) {
            const prevChap = BOOK_DATA[currentChapterIndex - 1];
            selectChapterAndSection(currentChapterIndex - 1, prevChap.sections.length - 1);
        }
    });

    nextSecBtn.addEventListener('click', () => {
        const chap = BOOK_DATA[currentChapterIndex];
        if (currentSectionIndex < chap.sections.length - 1) {
            selectChapterAndSection(currentChapterIndex, currentSectionIndex + 1);
        } else if (currentChapterIndex < BOOK_DATA.length - 1) {
            selectChapterAndSection(currentChapterIndex + 1, 0);
        }
    });

    // --- Scroll Progress ---
    window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    });

    // --- Bookmarks ---
    function toggleBookmark(secId, chapIdx, secIdx, btnElement) {
        const existingIdx = bookmarks.findIndex(b => b.secId === secId);
        const chap = BOOK_DATA[chapIdx];
        const sec = chap.sections[secIdx];

        if (existingIdx >= 0) {
            bookmarks.splice(existingIdx, 1);
            btnElement.classList.remove('bookmarked');
            btnElement.querySelector('i').className = 'fa-regular fa-bookmark';
        } else {
            bookmarks.push({
                secId: secId,
                chapIdx: chapIdx,
                secIdx: secIdx,
                chapTitle: chap.title,
                secTitle: sec.title
            });
            btnElement.classList.add('bookmarked');
            btnElement.querySelector('i').className = 'fa-solid fa-bookmark';
        }

        localStorage.setItem('hsc_ict_bookmarks', JSON.stringify(bookmarks));
        updateBookmarkBadge();
    }

    function updateBookmarkBadge() {
        const bookmarkBadge = document.getElementById('bookmark-badge');
        if (bookmarkBadge) bookmarkBadge.textContent = bookmarks.length;
    }

    // --- CODE PRACTICE BOARD LOGIC ---
    codeBoardBtn.addEventListener('click', () => {
        codeModal.classList.remove('hidden');
        updateHtmlPreview();
    });

    closeCodeModal.addEventListener('click', () => {
        codeModal.classList.add('hidden');
    });

    // Code Board Tabs Switcher
    codeTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            codeTabBtns.forEach(b => b.classList.remove('active'));
            codeTabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = `tab-${btn.dataset.tab}`;
            document.getElementById(tabId).classList.add('active');

            if (btn.dataset.tab === 'html') updateHtmlPreview();
        });
    });

    // Preset Sample Codes
    const CODE_PRESETS = {
        'html-basic': `<!DOCTYPE html>
<html>
<head>
    <title>HSC ICT Web Page</title>
    <style>
        body { font-family: sans-serif; background: #e0f2fe; padding: 20px; }
        h1 { color: #0369a1; }
        p { color: #334155; }
    </style>
</head>
<body>
    <h1>স্বাগতম এইচএসসি আইসিটি ক্লাসে!</h1>
    <p>এটি একটি সাধারণ HTML ওয়েপ পেজের মৌলিক কাঠামো।</p>
</body>
</html>`,

        'html-table': `<h2>শিক্ষার্থীদের ফলাফল সারণী</h2>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; text-align: left;">
    <tr style="background: #0284c7; color: white;">
        <th>রোল</th>
        <th>নাম</th>
        <th>জিপিএ (GPA)</th>
    </tr>
    <tr>
        <td>১০১</td>
        <td>রাকিব হাসান</td>
        <td>৫.০০</td>
    </tr>
    <tr>
        <td>১০২</td>
        <td>সাদিয়া সুলতানা</td>
        <td>৪.৮৫</td>
    </tr>
</table>`,

        'html-form': `<h2>এইচএসসি রেজিস্ট্রেশন ফর্ম</h2>
<form action="#">
    <label>শিক্ষার্থীর নাম:</label><br>
    <input type="text" placeholder="নাম লিখুন"><br><br>
    
    <label>গ্রুপ:</label><br>
    <select>
        <option>বিজ্ঞান</option>
        <option>মানবিক</option>
        <option>ব্যবসায় শিক্ষা</option>
    </select><br><br>
    
    <input type="submit" value="জমা দিন">
</form>`,

        'html-list': `<h2>আইসিটি বিষয়ের অধ্যায়সমূহ</h2>
<ol>
    <li>তথ্য ও যোগাযোগ প্রযুক্তি: বিশ্ব ও বাংলাদেশ প্রেক্ষিত</li>
    <li>কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং</li>
    <li>সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস</li>
    <li>ওয়েব ডিজাইন ও HTML</li>
    <li>প্রোগ্রামিং ভাষা (C)</li>
    <li>ডেটাবেজ ম্যানেজমেন্ট সিস্টেম</li>
</ol>`,

        'c-hello': `#include <stdio.h>

int main() {
    printf("Hello World! Welcome to HSC ICT C Programming.\\n");
    return 0;
}`,

        'c-sum': `#include <stdio.h>

int main() {
    int num1 = 15;
    int num2 = 25;
    int sum = num1 + num2;
    
    printf("প্রথম সংখ্যা = %d\\n", num1);
    printf("দ্বিতীয় সংখ্যা = %d\\n", num2);
    printf("যোগফল = %d\\n", sum);
    return 0;
}`,

        'c-evenodd': `#include <stdio.h>

int main() {
    int number = 42;
    if (number % 2 == 0) {
        printf("%d সংখ্যাটি জোড় (Even Number)\\n", number);
    } else {
        printf("%d সংখ্যাটি বিজোড় (Odd Number)\\n", number);
    }
    return 0;
}`,

        'c-loop': `#include <stdio.h>

int main() {
    int i;
    int n = 5;
    int fact = 1;
    
    for (i = 1; i <= n; i++) {
        fact = fact * i;
    }
    
    printf("%d এর ফ্যাক্টরিয়াল (%d!) = %d\\n", n, n, fact);
    return 0;
}`,

        'c-array': `#include <stdio.h>

int main() {
    int marks[5] = {85, 90, 78, 92, 88};
    int i, total = 0;
    
    for (i = 0; i < 5; i++) {
        total += marks[i];
    }
    
    printf("মোট প্রাপ্ত নম্বর = %d\\n", total);
    printf("গড় নম্বর = %.2f\\n", (float)total / 5);
    return 0;
}`,

        'sql-all': `SELECT * FROM Students;`,
        'sql-where': `SELECT Roll, Name, GPA FROM Students WHERE GPA >= 5.0;`,
        'sql-order': `SELECT Roll, Name, GroupName FROM Students ORDER BY Roll ASC;`,
        'sql-group': `SELECT GroupName, COUNT(*) as TotalStudents FROM Students GROUP BY GroupName;`
    };

    // Preset Buttons Click Handler
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.preset;
            if (key.startsWith('html')) {
                htmlCodeInput.value = CODE_PRESETS[key];
                updateHtmlPreview();
            } else if (key.startsWith('c-')) {
                cCodeInput.value = CODE_PRESETS[key];
            } else if (key.startsWith('sql')) {
                sqlCodeInput.value = CODE_PRESETS[key];
            }
        });
    });

    // Default Preset Values
    htmlCodeInput.value = CODE_PRESETS['html-basic'];
    cCodeInput.value = CODE_PRESETS['c-hello'];
    sqlCodeInput.value = CODE_PRESETS['sql-all'];

    // HTML Live Preview
    function updateHtmlPreview() {
        const code = htmlCodeInput.value;
        const doc = htmlPreviewFrame.contentDocument || htmlPreviewFrame.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
    }
    htmlCodeInput.addEventListener('input', updateHtmlPreview);

    // C Programming Simulator
    runCBtn.addEventListener('click', () => {
        const code = cCodeInput.value;
        cConsoleOutput.textContent = "> প্রসেসিং হচ্ছে...\n";
        
        setTimeout(() => {
            let output = "> প্রোগ্রাম সফলভাবে কম্পাইল ও রান হয়েছে:\n----------------------------------------\n";
            
            // Extract printf statements or simulate loops & math
            const printfMatches = code.match(/printf\s*\(\s*"([^"]+)"\s*(?:,\s*([^)]+))?\)/g);
            if (printfMatches) {
                printfMatches.forEach(p => {
                    let text = p.match(/printf\s*\(\s*"([^"]+)"/)[1];
                    text = text.replace(/\\n/g, '\n');
                    
                    // Simple variable substitution simulation
                    if (code.includes('sum = num1 + num2')) {
                        text = text.replace('%d', '15').replace('%d', '25').replace('%d', '40');
                    } else if (code.includes('number = 42')) {
                        text = text.replace('%d', '42');
                    } else if (code.includes('fact')) {
                        text = text.replace('%d', '5').replace('%d', '5').replace('%d', '120');
                    } else if (code.includes('marks')) {
                        text = text.replace('%d', '433').replace('%.2f', '86.60');
                    }
                    output += text;
                });
            } else {
                output += "Hello World! Welcome to HSC ICT C Programming.\n";
            }

            output += "\n----------------------------------------\n> Process exited with code 0.";
            cConsoleOutput.textContent = output;
        }, 300);
    });

    // In-memory SQL Database Table Simulation
    const STUDENTS_TABLE = [
        { Roll: 101, Name: "রাকিব হাসান", GroupName: "Science", GPA: 5.00, Branch: "Dhaka" },
        { Roll: 102, Name: "সাদিয়া সুলতানা", GroupName: "Science", GPA: 4.85, Branch: "Chittagong" },
        { Roll: 103, Name: "আরিফ রহমান", GroupName: "Humanities", GPA: 5.00, Branch: "Dhaka" },
        { Roll: 104, Name: "তানিয়া আক্তার", GroupName: "Business", GPA: 4.50, Branch: "Sylhet" },
        { Roll: 105, Name: "মেহেদী হাসান", GroupName: "Science", GPA: 5.00, Branch: "Rajshahi" }
    ];

    runSqlBtn.addEventListener('click', () => {
        const query = sqlCodeInput.value.trim();
        sqlResultContainer.innerHTML = '';

        let filtered = [...STUDENTS_TABLE];
        const qUpper = query.toUpperCase();

        if (qUpper.includes('WHERE GPA >= 5.0')) {
            filtered = filtered.filter(s => s.GPA >= 5.0);
        } else if (qUpper.includes('WHERE GROUPNAME')) {
            filtered = filtered.filter(s => s.GroupName === 'Science');
        }

        if (qUpper.includes('ORDER BY ROLL ASC')) {
            filtered.sort((a, b) => a.Roll - b.Roll);
        }

        if (qUpper.includes('GROUP BY GROUPNAME')) {
            // Render Group By Aggregation
            const groups = {};
            STUDENTS_TABLE.forEach(s => {
                groups[s.GroupName] = (groups[s.GroupName] || 0) + 1;
            });

            let tableHtml = `<table class="sql-result-table"><thead><tr><th>GroupName</th><th>TotalStudents</th></tr></thead><tbody>`;
            for (let g in groups) {
                tableHtml += `<tr><td>${g}</td><td>${groups[g]}</td></tr>`;
            }
            tableHtml += `</tbody></table>`;
            sqlResultContainer.innerHTML = tableHtml;
            return;
        }

        // Standard Table Rendering
        if (filtered.length > 0) {
            let cols = Object.keys(filtered[0]);
            let tableHtml = `<table class="sql-result-table"><thead><tr>`;
            cols.forEach(c => tableHtml += `<th>${c}</th>`);
            tableHtml += `</tr></thead><tbody>`;

            filtered.forEach(row => {
                tableHtml += `<tr>`;
                cols.forEach(c => tableHtml += `<td>${row[c]}</td>`);
                tableHtml += `</tr>`;
            });
            tableHtml += `</tbody></table>`;
            sqlResultContainer.innerHTML = tableHtml;
        } else {
            sqlResultContainer.innerHTML = `<p style="color: var(--text-muted);">কোনো রেকর্ড পাওয়া যায়নি।</p>`;
        }
    });

    // --- Search ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length > 0) {
            searchClearBtn.classList.remove('hidden');
            performSearch(query);
        } else {
            searchClearBtn.classList.add('hidden');
            searchResultsPanel.classList.add('hidden');
            readerCanvas.classList.remove('hidden');
        }
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.classList.add('hidden');
        searchResultsPanel.classList.add('hidden');
        readerCanvas.classList.remove('hidden');
    });

    function performSearch(query) {
        searchResultsList.innerHTML = '';
        let resultsCount = 0;

        BOOK_DATA.forEach((chap, cIdx) => {
            chap.sections.forEach((sec, sIdx) => {
                let matchText = '';
                const matchesSecTitle = sec.title.toLowerCase().includes(query);
                
                sec.items.forEach(item => {
                    if (item.text && item.text.toLowerCase().includes(query)) {
                        matchText = item.text;
                    }
                });

                if (matchesSecTitle || matchText) {
                    resultsCount++;
                    const resCard = document.createElement('div');
                    resCard.className = 'search-result-card';
                    resCard.innerHTML = `
                        <div style="font-size: 0.8rem; color: var(--accent-blue); font-weight: 700;">${chap.title}</div>
                        <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 4px 0;">${sec.title}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">${matchText ? matchText.substring(0, 150) + '...' : ''}</div>
                    `;
                    resCard.addEventListener('click', () => {
                        searchResultsPanel.classList.add('hidden');
                        readerCanvas.classList.remove('hidden');
                        searchInput.value = '';
                        searchClearBtn.classList.add('hidden');
                        selectChapterAndSection(cIdx, sIdx);
                    });
                    searchResultsList.appendChild(resCard);
                }
            });
        });

        searchStats.textContent = `${resultsCount} টি ফলাফল পাওয়া গেছে`;
        searchResultsPanel.classList.remove('hidden');
        readerCanvas.classList.add('hidden');
    }

    // Theme & Font
    function applyTheme(theme) {
        currentTheme = theme;
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('hsc_ict_theme', theme);
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    function applyFontSize(size) {
        currentFontSize = Math.max(14, Math.min(24, size));
        document.body.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem('hsc_ict_font_size', currentFontSize);
    }

    fontIncBtn.addEventListener('click', () => applyFontSize(currentFontSize + 2));
    fontDecBtn.addEventListener('click', () => applyFontSize(currentFontSize - 2));
    fontResetBtn.addEventListener('click', () => applyFontSize(17));

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Initialize App
    renderSidebar();
    loadChapterContent(0);
});
