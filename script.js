/**
 * ============================================
 * RuQiong - Digital Love Letter
 * Main Script
 * ============================================
 *
 * Logic tổng quan:
 * 1. Kiểm tra thời gian hiện tại so với TARGET_DATE
 * 2. Nếu chưa đến → hiển thị countdown (locked screen)
 * 3. Khi đến giờ → fade out locked screen, fade in letter
 * 4. Letter hiển thị với typing effect + staggered paragraph fade-in
 * 5. Floating particles chạy nền cho cả 2 trạng thái
 */

(function () {
  'use strict';

  // =============================================
  // CẤU HÌNH - Thay đổi ở đây
  // =============================================

  /**
   * TARGET_DATE: Ngày giờ mà bức thư sẽ được mở.
   * Format: 'YYYY-MM-DDTHH:MM:SS'
   * Ví dụ: '2026-06-14T20:00:00' = 14/06/2026 lúc 8 giờ tối
   *
   * ⚠️ Lưu ý: Thời gian theo múi giờ local của người xem.
   * Nếu muốn chỉ định timezone cụ thể, thêm offset:
   * Ví dụ: '2026-06-14T20:00:00+07:00' (giờ Việt Nam)
   */
  // const TARGET_DATE = '2027-10-17T00:00:00+07:00';
  const TARGET_DATE = '2026-06-13T02:22:00+07:00';

  /**
   * GREETING_TEXT: Lời chào sẽ được hiển thị bằng hiệu ứng gõ chữ.
   */
  const GREETING_TEXT = 'Quỳnh à,';

  /**
   * TYPING_SPEED: Tốc độ gõ chữ (ms mỗi ký tự). Nhỏ hơn = nhanh hơn.
   */
  const TYPING_SPEED = 150;

  /**
   * LETTER_TYPING_SPEED: Tốc độ gõ chữ nội dung thư (ms mỗi ký tự).
   * Nhỏ hơn = nhanh hơn. Khuyến nghị: 25-40ms.
   */
  const LETTER_TYPING_SPEED = 30;

  /**
   * PARAGRAPH_GAP: Khoảng nghỉ (ms) giữa các đoạn văn khi gõ.
   */
  const PARAGRAPH_GAP = 400;


  // =============================================
  // DOM ELEMENTS
  // =============================================
  const lockedScreen  = document.getElementById('locked-screen');
  const letterScreen  = document.getElementById('letter-screen');
  const greetingEl    = document.getElementById('greeting-text');
  const letterBody    = document.getElementById('letter-body');
  const signatureEl   = document.getElementById('letter-signature');
  const psEl          = document.getElementById('letter-ps');
  const musicToggle   = document.getElementById('music-toggle');
  const bgMusic       = document.getElementById('bg-music');
  const canvas        = document.getElementById('particles-canvas');

  // Countdown display elements
  const daysEl    = document.getElementById('countdown-days');
  const hoursEl   = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');


  // =============================================
  // 1. COUNTDOWN LOGIC
  // =============================================

  const targetTime = new Date(TARGET_DATE).getTime();
  let countdownInterval = null;

  /**
   * Cập nhật countdown display.
   * Trả về true nếu đã hết thời gian.
   */
  function updateCountdown() {
    const now = Date.now();
    const diff = targetTime - now;

    // Đã đến giờ hoặc đã qua
    if (diff <= 0) {
      daysEl.textContent    = '00';
      hoursEl.textContent   = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return true;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Cập nhật số với padding 0
    const newDays = String(days).padStart(2, '0');
    const newHours = String(hours).padStart(2, '0');
    const newMinutes = String(minutes).padStart(2, '0');
    const newSeconds = String(seconds).padStart(2, '0');

    // Thêm hiệu ứng "tick" khi giá trị thay đổi
    if (secondsEl.textContent !== newSeconds) {
      secondsEl.classList.add('tick');
      setTimeout(() => secondsEl.classList.remove('tick'), 200);
    }

    daysEl.textContent    = newDays;
    hoursEl.textContent   = newHours;
    minutesEl.textContent = newMinutes;
    secondsEl.textContent = newSeconds;

    return false;
  }

  /**
   * Bắt đầu countdown. Khi đến giờ, tự động chuyển sang letter.
   */
  function startCountdown() {
    // Cập nhật ngay lần đầu
    const isReady = updateCountdown();

    if (isReady) {
      revealLetter();
      return;
    }

    // Cập nhật mỗi giây
    countdownInterval = setInterval(() => {
      const isReady = updateCountdown();
      if (isReady) {
        clearInterval(countdownInterval);
        revealLetter();
      }
    }, 1000);
  }


  // =============================================
  // 2. LETTER REVEAL TRANSITION
  // =============================================

  /**
   * Chuyển từ locked screen sang letter screen.
   * Sequence: fade out locked → fade in letter → typing → paragraphs
   */
  function revealLetter() {
    // Bước 1: Fade out locked screen
    lockedScreen.classList.add('fade-out');

    // Bước 2: Sau khi locked screen biến mất, hiển thị letter
    setTimeout(() => {
      lockedScreen.style.display = 'none';
      letterScreen.classList.add('visible');

      // Bước 3: Bắt đầu typing effect sau khi letter xuất hiện
      setTimeout(() => {
        typeGreeting(GREETING_TEXT, () => {
          // Bước 4: Sau khi typing xong, fade in từng đoạn văn
          revealParagraphs();
        });
      }, 800);

      // Hiển thị nút nhạc
      setTimeout(() => {
        musicToggle.classList.add('visible');
      }, 1200);

    }, 1500); // Khớp với thời gian transition CSS (1.5s)
  }


  // =============================================
  // 3. TYPING EFFECT
  // =============================================

  /**
   * Hiệu ứng gõ chữ từng ký tự.
   * @param {string} text - Nội dung cần gõ
   * @param {Function} callback - Hàm gọi sau khi gõ xong
   */
  function typeGreeting(text, callback) {
    let i = 0;
    greetingEl.innerHTML = '<span class="cursor"></span>';

    const typingInterval = setInterval(() => {
      if (i < text.length) {
        // Chèn ký tự trước cursor
        const cursor = greetingEl.querySelector('.cursor');
        const charSpan = document.createTextNode(text.charAt(i));
        greetingEl.insertBefore(charSpan, cursor);
        i++;
      } else {
        clearInterval(typingInterval);

        // Xóa cursor sau 1 giây
        setTimeout(() => {
          const cursor = greetingEl.querySelector('.cursor');
          if (cursor) cursor.remove();
        }, 1200);

        if (callback) callback();
      }
    }, TYPING_SPEED);
  }


  // =============================================
  // 4. CHARACTER-BY-CHARACTER TYPING
  // =============================================

  /**
   * Phân tách HTML thành các segment: ký tự text, HTML tags, HTML entities.
   * Tags được chèn tức thì, ký tự text được gõ từng cái một.
   */
  function parseHtmlSegments(html) {
    const segments = [];
    let i = 0;
    while (i < html.length) {
      if (html[i] === '<') {
        // Tìm kết thúc tag
        const end = html.indexOf('>', i);
        if (end !== -1) {
          segments.push({ type: 'tag', content: html.substring(i, end + 1) });
          i = end + 1;
        } else {
          segments.push({ type: 'char', content: html[i] });
          i++;
        }
      } else if (html[i] === '&') {
        // Xử lý HTML entity (VD: &ldquo; &rdquo;)
        const end = html.indexOf(';', i);
        if (end !== -1 && end - i < 12) {
          segments.push({ type: 'char', content: html.substring(i, end + 1) });
          i = end + 1;
        } else {
          segments.push({ type: 'char', content: html[i] });
          i++;
        }
      } else {
        segments.push({ type: 'char', content: html[i] });
        i++;
      }
    }
    return segments;
  }

  /**
   * Gõ nội dung HTML từng ký tự một.
   * - HTML tags được thêm tức thì (không hiển thị từng ký tự của tag)
   * - Tự động nghỉ lâu hơn ở dấu chấm câu để tạo nhịp đọc tự nhiên
   * - Dùng tag stack để đảm bảo HTML luôn hợp lệ khi hiển thị
   *
   * @param {HTMLElement} element - Phần tử chứa nội dung cần gõ
   * @param {number} speed - Tốc độ gõ (ms mỗi ký tự)
   * @param {Function} callback - Hàm gọi sau khi gõ xong
   */
  function typeHtmlContent(element, speed, callback) {
    // Chuẩn hóa HTML: gộp khoảng trắng thừa (từ indentation)
    const fullHtml = element.innerHTML.trim().replace(/\s+/g, ' ');
    const segments = parseHtmlSegments(fullHtml);

    element.innerHTML = '';
    element.classList.add('visible');

    let builtHtml = '';
    let tagStack = [];  // Theo dõi tags đang mở để đóng đúng
    let idx = 0;

    function step() {
      // Thêm tất cả tags liên tiếp ngay lập tức
      while (idx < segments.length && segments[idx].type === 'tag') {
        const tag = segments[idx].content;
        builtHtml += tag;

        if (tag.startsWith('</')) {
          tagStack.pop();
        } else if (!tag.endsWith('/>') && !tag.startsWith('<!')) {
          const match = tag.match(/^<(\w+)/);
          if (match) tagStack.push(match[1]);
        }
        idx++;
      }

      // Hết nội dung → hoàn tất
      if (idx >= segments.length) {
        element.innerHTML = fullHtml; // Khôi phục HTML gốc cho chính xác
        if (callback) callback();
        return;
      }

      // Thêm ký tự tiếp theo
      const seg = segments[idx];
      builtHtml += seg.content;
      idx++;

      // Đóng tạm các tags đang mở để HTML hiển thị hợp lệ
      let displayHtml = builtHtml;
      for (let j = tagStack.length - 1; j >= 0; j--) {
        displayHtml += '</' + tagStack[j] + '>';
      }
      element.innerHTML = displayHtml;

      // Tốc độ biến thiên theo loại ký tự → nhịp đọc tự nhiên
      const ch = seg.content;
      let delay = speed;
      if ('.?!'.includes(ch))        delay = speed * 8;   // Nghỉ dài ở cuối câu
      else if (',:;\u2014'.includes(ch)) delay = speed * 4; // Nghỉ vừa ở dấu phẩy
      else if (ch === ' ')           delay = Math.max(speed * 0.4, 8);

      setTimeout(step, delay);
    }

    step();
  }

  /**
   * Gõ nội dung từng đoạn văn theo thứ tự.
   * Mỗi đoạn được gõ từng ký tự, có khoảng nghỉ giữa các đoạn.
   */
  function revealParagraphs() {
    const elements = letterBody.querySelectorAll('p, blockquote');
    let current = 0;

    function typeNext() {
      if (current >= elements.length) {
        // Sau đoạn cuối → hiện signature và PS
        setTimeout(() => {
          signatureEl.classList.add('visible');
        }, PARAGRAPH_GAP);
        setTimeout(() => {
          psEl.classList.add('visible');
        }, PARAGRAPH_GAP * 2);
        return;
      }

      const el = elements[current];
      current++;

      typeHtmlContent(el, LETTER_TYPING_SPEED, () => {
        setTimeout(typeNext, PARAGRAPH_GAP);
      });
    }

    typeNext();
  }


  // =============================================
  // 5. FLOATING PARTICLES (Bokeh Effect)
  // =============================================

  /**
   * Tạo hiệu ứng hạt sáng nổi nhẹ nhàng trên nền.
   * Sử dụng Canvas API cho hiệu suất tối ưu.
   */
  function initParticles() {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;

    // Resize handler
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    // Tạo 1 hạt
    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1, // hơi bay lên
        opacity: Math.random() * 0.4 + 0.1,
        // Màu ngẫu nhiên trong tông pastel ấm
        hue: Math.random() * 30 + 15, // vàng-cam nhẹ
        pulse: Math.random() * Math.PI * 2, // phase cho hiệu ứng nhấp nháy
      };
    }

    // Khởi tạo các hạt - ít hơn trên mobile
    function initParticleArray() {
      const count = window.innerWidth < 600 ? 20 : 35;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    }

    // Vòng lặp animation
    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        // Cập nhật vị trí
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.01;

        // Hiệu ứng nhấp nháy nhẹ
        const currentOpacity = p.opacity * (0.6 + Math.sin(p.pulse) * 0.4);

        // Wrap around
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Vẽ hạt
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 40%, 75%, ${currentOpacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    // Khởi chạy
    resize();
    initParticleArray();
    animate();

    // Resize listener (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resize();
        initParticleArray();
      }, 250);
    });

    // Dừng animation khi tab không active (tiết kiệm tài nguyên)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
  }


  // =============================================
  // 6. MUSIC CONTROL
  // =============================================

  let isMusicPlaying = false;

  function initMusicToggle() {
    musicToggle.addEventListener('click', () => {
      if (!bgMusic.querySelector('source') && !bgMusic.src) {
        // Nếu chưa có file nhạc, hiện thông báo nhẹ
        console.info(
          '🎵 Để thêm nhạc nền:\n' +
          '1. Đặt file nhạc (VD: music.mp3) cùng thư mục với index.html\n' +
          '2. Uncomment dòng <source> trong index.html\n' +
          '3. Hoặc gán bgMusic.src = "URL_nhac" trong script.js'
        );
        return;
      }

      if (isMusicPlaying) {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
      } else {
        bgMusic.volume = 0.3; // Âm lượng nhỏ, nhẹ nhàng
        bgMusic.play().catch(err => {
          console.warn('Không thể phát nhạc:', err);
        });
        musicToggle.classList.add('playing');
      }
      isMusicPlaying = !isMusicPlaying;
    });
  }


  // =============================================
  // 7. INITIALIZATION
  // =============================================

  function init() {
    // Khởi tạo particles
    initParticles();

    // Khởi tạo music toggle
    initMusicToggle();

    // Bắt đầu countdown hoặc hiện thư ngay
    startCountdown();
  }

  // Chạy khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
