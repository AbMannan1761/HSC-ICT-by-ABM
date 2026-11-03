/* ==========================================================================
   HSC ICT Interactive Web Application JavaScript Logic with Code Playground
   Updated: 3-Module Architecture (১। পাঠ্যবই পঠন, ২। অনুশীলন, ৩। মূল্যায়ন ও পরীক্ষা)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentChapterIndex = 0;
    let currentSectionIndex = 0;
    let currentModule = 'textbook'; // 'textbook' | 'practice' | 'exam'
    let activeAccordionChap = null; // বাই ডিফল্ট সব অধ্যায় বন্ধ থাকবে (screenshot format)
    let textbookSublistOpen = false;

    // Exam State
    let examTimerInterval = null;
    let examTimeRemaining = 25 * 60; // 25 minutes
    let userExamAnswers = {};
    let isExamSubmitted = false;

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

    // --- Render Sidebar Accordion Chapters ---
    function renderSidebar() {
        chapterNav.innerHTML = '';
        if (typeof BOOK_DATA === 'undefined' || !BOOK_DATA.length) {
            chapterNav.innerHTML = '<p style="padding: 20px; color: var(--text-muted);">বইয়ের ডাটা লোড হয়নি।</p>';
            return;
        }

        BOOK_DATA.forEach((chap, chapIdx) => {
            const chapItem = document.createElement('div');
            const isAccordionActive = (chapIdx === activeAccordionChap);
            chapItem.className = `chap-accordion-item ${isAccordionActive ? 'active' : ''}`;

            // Chapter Header Button
            const headerBtn = document.createElement('button');
            headerBtn.className = 'chap-header-btn';
            headerBtn.innerHTML = `
                <span><i class="fa-solid fa-book-open"></i> ${chap.title}</span>
                <i class="fa-solid fa-chevron-down"></i>
            `;

            // Click chapter header -> Toggle Chapter Accordion
            headerBtn.addEventListener('click', () => {
                if (activeAccordionChap === chapIdx) {
                    activeAccordionChap = null;
                } else {
                    activeAccordionChap = chapIdx;
                    currentChapterIndex = chapIdx;
                    loadChapterContent(chapIdx);
                }
                renderSidebar();
            });

            // Chapter 3 Modules Sub-group (Visible only when expanded)
            const moduleGroup = document.createElement('div');
            moduleGroup.className = 'chap-module-group';

            if (isAccordionActive) {
                // 1. পাঠ্যবই পঠন Button
                const textbookBtn = document.createElement('div');
                const isTextbookActive = (chapIdx === currentChapterIndex && currentModule === 'textbook');
                textbookBtn.className = `module-header-btn ${isTextbookActive ? 'active' : ''}`;
                textbookBtn.innerHTML = `
                    <span><i class="fa-solid fa-book"></i> ১। পাঠ্যবই পঠন</span>
                    <i class="fa-solid fa-caret-${textbookSublistOpen ? 'up' : 'down'}" style="font-size:0.85rem;"></i>
                `;
                textbookBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentChapterIndex = chapIdx;
                    currentModule = 'textbook';
                    textbookSublistOpen = !textbookSublistOpen;
                    loadChapterContent(chapIdx);
                    renderSidebar();
                });
                moduleGroup.appendChild(textbookBtn);

                // Textbook Sub-sections list
                const subList = document.createElement('div');
                subList.className = `module-subsections ${textbookSublistOpen ? 'open' : ''}`;
                const tSections = chap.textbook_sections || chap.sections || [];
                tSections.forEach((sec, secIdx) => {
                    const secLink = document.createElement('div');
                    const isSecActive = (chapIdx === currentChapterIndex && currentModule === 'textbook' && secIdx === currentSectionIndex);
                    secLink.className = `sec-link-item ${isSecActive ? 'active-sec' : ''}`;
                    secLink.innerHTML = `<i class="fa-regular fa-file-lines"></i> ${sec.title}`;
                    secLink.addEventListener('click', (e) => {
                        e.stopPropagation();
                        currentChapterIndex = chapIdx;
                        currentModule = 'textbook';
                        currentSectionIndex = secIdx;
                        loadChapterContent(chapIdx);
                        renderSidebar();
                        const secCard = document.getElementById(`sec-card-${sec.id}`);
                        if (secCard) {
                            secCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        if (window.innerWidth <= 900) {
                            sidebar.classList.remove('open');
                        }
                    });
                    subList.appendChild(secLink);
                });
                moduleGroup.appendChild(subList);

                // 2. অনুশীলন Button
                const practiceBtn = document.createElement('div');
                const isPracticeActive = (chapIdx === currentChapterIndex && currentModule === 'practice');
                practiceBtn.className = `module-header-btn ${isPracticeActive ? 'active' : ''}`;
                practiceBtn.innerHTML = `
                    <span><i class="fa-solid fa-pen-to-square"></i> ২। অনুশীলন</span>
                    <span class="module-badge">বোর্ড গাইড</span>
                `;
                practiceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentChapterIndex = chapIdx;
                    currentModule = 'practice';
                    loadChapterContent(chapIdx);
                    renderSidebar();
                    if (window.innerWidth <= 900) {
                        sidebar.classList.remove('open');
                    }
                });
                moduleGroup.appendChild(practiceBtn);

                // 3. মূল্যায়ন ও পরীক্ষা Button
                const examBtn = document.createElement('div');
                const isExamActive = (chapIdx === currentChapterIndex && currentModule === 'exam');
                examBtn.className = `module-header-btn ${isExamActive ? 'active' : ''}`;
                examBtn.innerHTML = `
                    <span><i class="fa-solid fa-stopwatch"></i> ৩। মূল্যায়ন ও পরীক্ষা</span>
                    <span class="module-badge exam-badge">কুইজ</span>
                `;
                examBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentChapterIndex = chapIdx;
                    currentModule = 'exam';
                    loadChapterContent(chapIdx);
                    renderSidebar();
                    if (window.innerWidth <= 900) {
                        sidebar.classList.remove('open');
                    }
                });
                moduleGroup.appendChild(examBtn);
            }

            chapItem.appendChild(headerBtn);
            chapItem.appendChild(moduleGroup);
            chapterNav.appendChild(chapItem);
        });
    }

    // --- Render Section Card Helper ---
    function createSectionCard(sec, chapIdx, secIdx) {
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

        if (sec.items && sec.items.length) {
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
        } else if (sec.content) {
            const p = document.createElement('div');
            p.className = 'content-paragraph';
            p.innerHTML = sec.content;
            cardBody.appendChild(p);
        }

        secCard.appendChild(cardHeader);
        secCard.appendChild(cardBody);
        return secCard;
    }

    // --- Module 3: Online Exam & Evaluation Render ---
    function renderExamModule(chap) {
        if (examTimerInterval) clearInterval(examTimerInterval);
        examTimeRemaining = 25 * 60;
        userExamAnswers = {};
        isExamSubmitted = false;

        const quizList = chap.quiz || [];
        if (!quizList.length) {
            sectionsContainer.innerHTML = `
                <div class="quiz-container" style="text-align: center; padding: 40px;">
                    <i class="fa-solid fa-file-circle-question" style="font-size: 3rem; color: var(--accent-blue); margin-bottom: 16px;"></i>
                    <h2>এই অধ্যায়ের কুইজ প্রশ্ন প্রস্তুত হচ্ছে...</h2>
                    <p style="color: var(--text-secondary); margin-top: 8px;">অনুগ্রহ করে '২। অনুশীলন' অংশ থেকে প্রশ্নসমূহ অধ্যয়ন করুন।</p>
                </div>
            `;
            return;
        }

        const container = document.createElement('div');
        container.className = 'quiz-container';

        // Exam Header Card with Live Timer
        const headerCard = document.createElement('div');
        headerCard.className = 'quiz-header-card';
        headerCard.innerHTML = `
            <div>
                <h2 style="font-size: 1.4rem; color: var(--text-primary); margin-bottom: 6px;">
                    <i class="fa-solid fa-graduation-cap text-gradient"></i> অধ্যায় ${chap.number} অনলাইন মূল্যায়ন ও পরীক্ষা
                </h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">
                    মোট প্রশ্ন: ${quizList.length} টি • প্রতিটি প্রশ্নের মান: ১ • সময়: ২৫ মিনিট
                </p>
            </div>
            <div id="quiz-timer" class="quiz-timer-badge">
                <i class="fa-solid fa-clock"></i> <span id="timer-display">25:00</span>
            </div>
        `;
        container.appendChild(headerCard);

        // Questions List
        const questionsBox = document.createElement('div');
        questionsBox.id = 'exam-questions-list';

        quizList.forEach((q, qIdx) => {
            const qBox = document.createElement('div');
            qBox.className = 'quiz-question-box';
            qBox.id = `q-box-${qIdx}`;

            qBox.innerHTML = `
                <div class="quiz-q-title"><strong>প্রশ্ন ${q.number || qIdx + 1}:</strong> ${q.question}</div>
                <div class="quiz-options-grid">
                    ${['ক', 'খ', 'গ', 'ঘ'].map(optKey => {
                        const optText = q.options[optKey] || '';
                        return `
                            <label class="quiz-option-label" data-q-idx="${qIdx}" data-opt="${optKey}">
                                <input type="radio" name="q_${qIdx}" value="${optKey}">
                                <span><strong>(${optKey})</strong> ${optText}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
                <div id="q-explanation-${qIdx}" class="explanation-box hidden"></div>
            `;
            questionsBox.appendChild(qBox);
        });

        container.appendChild(questionsBox);

        // Submit Button Container
        const submitContainer = document.createElement('div');
        submitContainer.style.textAlign = 'center';
        submitContainer.style.marginTop = '30px';

        const submitBtn = document.createElement('button');
        submitBtn.className = 'quiz-submit-btn';
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> পরীক্ষা সম্পন্ন ও উত্তর জমা দিন`;
        submitBtn.addEventListener('click', () => submitExam(chap));

        submitContainer.appendChild(submitBtn);
        container.appendChild(submitContainer);

        sectionsContainer.innerHTML = '';
        sectionsContainer.appendChild(container);

        // Option selection listener
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const qIdx = e.target.name.replace('q_', '');
                userExamAnswers[qIdx] = e.target.value;
            });
        });

        // Start Live Timer
        startExamTimer(chap);
    }

    function startExamTimer(chap) {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;

        examTimerInterval = setInterval(() => {
            examTimeRemaining--;
            const mins = Math.floor(examTimeRemaining / 60);
            const secs = examTimeRemaining % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (examTimeRemaining <= 0) {
                clearInterval(examTimerInterval);
                alert('সময় শেষ! আপনার উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা নেওয়া হচ্ছে।');
                submitExam(chap);
            }
        }, 1000);
    }

    function submitExam(chap) {
        if (isExamSubmitted) return;
        isExamSubmitted = true;
        if (examTimerInterval) clearInterval(examTimerInterval);

        const quizList = chap.quiz || [];
        let score = 0;

        quizList.forEach((q, qIdx) => {
            const userAns = userExamAnswers[qIdx];
            const correctAns = q.answer;
            const qBox = document.getElementById(`q-box-${qIdx}`);
            const expBox = document.getElementById(`q-explanation-${qIdx}`);

            if (userAns === correctAns) {
                score++;
                if (qBox) qBox.classList.add('review-correct');
            } else {
                if (qBox) qBox.classList.add('review-wrong');
            }

            if (expBox) {
                expBox.classList.remove('hidden');
                expBox.innerHTML = `
                    <div style="font-weight: bold; color: #10b981; margin-bottom: 4px;">
                        <i class="fa-solid fa-check"></i> সঠিক উত্তর: (${correctAns}) ${q.answer_text || q.options[correctAns] || ''}
                    </div>
                    ${q.explanation ? `<div><em>ব্যাখ্যা:</em> ${q.explanation}</div>` : ''}
                `;
            }
        });

        // Percentage & Grade
        const percentage = Math.round((score / quizList.length) * 100);
        let grade = 'F';
        if (percentage >= 80) grade = 'A+';
        else if (percentage >= 70) grade = 'A';
        else if (percentage >= 60) grade = 'A-';
        else if (percentage >= 50) grade = 'B';
        else if (percentage >= 40) grade = 'C';
        else if (percentage >= 33) grade = 'D';

        // Render Result Banner
        const resultBanner = document.createElement('div');
        resultBanner.className = 'quiz-result-banner';
        resultBanner.innerHTML = `
            <div style="font-size: 2.8rem; margin-bottom: 8px;">
                ${percentage >= 50 ? '🎉' : '📚'}
            </div>
            <h2 style="font-size: 1.8rem; color: var(--text-primary); margin-bottom: 6px;">
                আপনার পরীক্ষার ফলাফল: ${score} / ${quizList.length}
            </h2>
            <div style="font-size: 1.15rem; color: var(--accent-blue); font-weight: 700; margin-bottom: 12px;">
                প্রাপ্ত নম্বর: ${percentage}% • গ্রেড: ${grade}
            </div>
            <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto 20px;">
                নিচে প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা প্রদর্শিত হয়েছে। ভুলগুলো সংশোধন করে পুনরায় পরীক্ষা দিতে পারেন।
            </p>
            <button id="retake-exam-btn" class="quiz-submit-btn" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--accent-blue);">
                <i class="fa-solid fa-rotate-right"></i> পুনরায় পরীক্ষা দিন
            </button>
        `;

        const container = document.querySelector('.quiz-container');
        if (container) {
            container.insertBefore(resultBanner, container.querySelector('#exam-questions-list'));
            resultBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.getElementById('retake-exam-btn').addEventListener('click', () => {
                renderExamModule(chap);
            });
        }
    }

    // --- Load Chapter Content (Textbook / Practice / Exam) ---
    function loadChapterContent(chapIdx) {
        if (!BOOK_DATA[chapIdx]) return;
        const chap = BOOK_DATA[chapIdx];

        heroBadge.textContent = `অধ্যায় ${chap.number}`;
        heroTitle.textContent = chap.title;

        // Top Module Switcher Tabs
        const moduleSwitcher = document.createElement('div');
        moduleSwitcher.className = 'chapter-module-switcher';
        moduleSwitcher.innerHTML = `
            <button class="mod-tab ${currentModule === 'textbook' ? 'active' : ''}" data-mod="textbook">
                <i class="fa-solid fa-book-open"></i> ১। পাঠ্যবই পঠন
            </button>
            <button class="mod-tab ${currentModule === 'practice' ? 'active' : ''}" data-mod="practice">
                <i class="fa-solid fa-pen-to-square"></i> ২। অনুশীলন
            </button>
            <button class="mod-tab ${currentModule === 'exam' ? 'active' : ''}" data-mod="exam">
                <i class="fa-solid fa-graduation-cap"></i> ৩। মূল্যায়ন ও পরীক্ষা
            </button>
        `;

        moduleSwitcher.querySelectorAll('.mod-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mod = tab.dataset.mod;
                currentModule = mod;
                loadChapterContent(chapIdx);
                renderSidebar();
            });
        });

        sectionsContainer.innerHTML = '';
        sectionsContainer.appendChild(moduleSwitcher);

        if (currentModule === 'textbook') {
            const tSections = chap.textbook_sections || chap.sections || [];
            secCount.textContent = tSections.length;
            readTime.textContent = Math.ceil(tSections.length * 2.5);

            tSections.forEach((sec, secIdx) => {
                const card = createSectionCard(sec, chapIdx, secIdx);
                sectionsContainer.appendChild(card);
            });
        } else if (currentModule === 'practice') {
            secCount.textContent = 'পূর্ণাঙ্গ গাইড';
            readTime.textContent = '২০';

            if (chap.practice_section) {
                const card = createSectionCard(chap.practice_section, chapIdx, 0);
                sectionsContainer.appendChild(card);
            }
        } else if (currentModule === 'exam') {
            secCount.textContent = '২৫ টি প্রশ্ন';
            readTime.textContent = '২৫';
            renderExamModule(chap);
        }

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
        currentChapterIndex = chapIdx;
        currentSectionIndex = secIdx;
        activeAccordionChap = chapIdx;
        currentModule = 'textbook';
        loadChapterContent(currentChapterIndex);
        renderSidebar();

        const chap = BOOK_DATA[currentChapterIndex];
        const tSections = chap.textbook_sections || chap.sections || [];
        const targetSec = tSections[currentSectionIndex];

        if (targetSec) {
            const secCard = document.getElementById(`sec-card-${targetSec.id}`);
            if (secCard) {
                secCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        updateNavControls();
    }

    function updateNavControls() {
        const chap = BOOK_DATA[currentChapterIndex];
        if (!chap) return;

        const tSections = chap.textbook_sections || chap.sections || [];
        pageIndicator.textContent = currentModule === 'textbook'
            ? `পরিচ্ছেদ ${currentSectionIndex + 1} / ${tSections.length}`
            : (currentModule === 'practice' ? 'অনুশীলন অংশ' : 'মূল্যায়ন ও পরীক্ষা');

        prevSecBtn.disabled = (currentChapterIndex === 0 && currentSectionIndex === 0);
        nextSecBtn.disabled = (currentChapterIndex === BOOK_DATA.length - 1 && currentSectionIndex === tSections.length - 1);
    }

    prevSecBtn.addEventListener('click', () => {
        if (currentSectionIndex > 0) {
            selectChapterAndSection(currentChapterIndex, currentSectionIndex - 1);
        } else if (currentChapterIndex > 0) {
            const prevChap = BOOK_DATA[currentChapterIndex - 1];
            const prevSections = prevChap.textbook_sections || prevChap.sections || [];
            selectChapterAndSection(currentChapterIndex - 1, prevSections.length - 1);
        }
    });

    nextSecBtn.addEventListener('click', () => {
        const chap = BOOK_DATA[currentChapterIndex];
        const tSections = chap.textbook_sections || chap.sections || [];
        if (currentSectionIndex < tSections.length - 1) {
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

    // --- Bookmarks Management ---
    function toggleBookmark(secId, chapIdx, secIdx, btn) {
        const index = bookmarks.findIndex(b => b.secId === secId);
        if (index > -1) {
            bookmarks.splice(index, 1);
            btn.classList.remove('bookmarked');
            btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        } else {
            const chap = BOOK_DATA[chapIdx];
            const sec = (chap.textbook_sections || chap.sections)[secIdx] || chap.practice_section;
            bookmarks.push({
                secId: secId,
                chapIdx: chapIdx,
                secIdx: secIdx,
                chapTitle: chap.title,
                secTitle: sec ? sec.title : ''
            });
            btn.classList.add('bookmarked');
            btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        }
        localStorage.setItem('hsc_ict_bookmarks', JSON.stringify(bookmarks));
        updateBookmarkBadge();
    }

    function updateBookmarkBadge() {
        // Reserved for header bookmark badge if added
    }

    // --- Image Modal ---
    function openImageModal(src, title) {
        const modal = document.createElement('div');
        modal.className = 'image-viewer-modal';
        modal.innerHTML = `
            <div class="image-viewer-content">
                <button class="image-viewer-close"><i class="fa-solid fa-xmark"></i></button>
                <img src="${src}" alt="${title}">
                <div class="image-viewer-caption">${title}</div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.image-viewer-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // --- Code Practice Playground Logic ---
    if (codeBoardBtn) {
        codeBoardBtn.addEventListener('click', () => {
            codeModal.classList.remove('hidden');
        });
    }

    if (closeCodeModal) {
        closeCodeModal.addEventListener('click', () => {
            codeModal.classList.add('hidden');
        });
    }

    codeTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            codeTabBtns.forEach(b => b.classList.remove('active'));
            codeTabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            const targetContent = document.getElementById(`${target}-tab`);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    if (htmlCodeInput) {
        htmlCodeInput.addEventListener('input', updateHtmlPreview);
        updateHtmlPreview();
    }

    function updateHtmlPreview() {
        if (!htmlPreviewFrame || !htmlCodeInput) return;
        const code = htmlCodeInput.value;
        const doc = htmlPreviewFrame.contentDocument || htmlPreviewFrame.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
    }

    // Interactive C Simulator
    if (runCBtn) {
        runCBtn.addEventListener('click', () => {
            const code = cCodeInput.value;
            cConsoleOutput.textContent = 'কম্পাইলিং এবং রান হচ্ছে...\n';
            setTimeout(() => {
                cConsoleOutput.textContent = '';
                const printMatches = code.match(/printf\s*\(\s*"([^"]*)"\s*\);/g);
                if (printMatches) {
                    printMatches.forEach(m => {
                        const content = m.replace(/printf\s*\(\s*"/, '').replace(/"\s*\);/, '');
                        cConsoleOutput.textContent += content.replace(/\\n/g, '\n');
                    });
                } else {
                    cConsoleOutput.textContent = 'প্রোগ্রাম সফলভাবে এক্সিকিউট হয়েছে (কোনো printf আউটপুট নেই)।';
                }
            }, 300);
        });
    }

    // --- Search Logic Across All Modules ---
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length > 1) {
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
            const allSecs = (chap.textbook_sections || chap.sections || []).concat(chap.practice_section ? [chap.practice_section] : []);

            allSecs.forEach((sec, sIdx) => {
                let matchText = '';
                const matchesSecTitle = sec.title.toLowerCase().includes(query);

                if (sec.items) {
                    sec.items.forEach(item => {
                        if (item.text && item.text.toLowerCase().includes(query)) {
                            matchText = item.text.replace(/<[^>]*>/g, ' ');
                        }
                    });
                } else if (sec.content && sec.content.toLowerCase().includes(query)) {
                    matchText = sec.content.replace(/<[^>]*>/g, ' ');
                }

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

    // --- Theme & Font Settings ---
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

    // --- Initialize App ---
    // বাই ডিফল্ট সব অধ্যায় কলাপ্সড থাকবে (screenshot format)
    activeAccordionChap = null;
    currentModule = 'textbook';
    renderSidebar();
    loadChapterContent(0);
});
