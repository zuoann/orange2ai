/**
 * 职业教育研究网站 - 交互脚本
 * 实现粒子效果、滚动动画、数字计数等交互功能
 */

// ========================================
// 粒子背景效果
// ========================================
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.particleCount = 50;
        this.init();
    }

    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // 随机大小
        const size = Math.random() * 3 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // 随机动画延迟和持续时间
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
        
        // 随机颜色（霓虹色系）
        const colors = ['#00ff88', '#00d4ff', '#7c3aed', '#ff00ff'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }
}

// ========================================
// 导航栏滚动效果
// ========================================
class NavbarScroll {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.lastScroll = 0;
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll());
        this.handleScroll(); // 初始检查
    }

    handleScroll() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
        
        this.lastScroll = currentScroll;
    }
}

// ========================================
// 平滑滚动
// ========================================
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleClick(e, anchor));
        });
    }

    handleClick(e, anchor) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // 更新活动链接
            this.updateActiveLink(targetId);
        }
    }

    updateActiveLink(targetId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === targetId) {
                link.classList.add('active');
            }
        });
    }
}

// ========================================
// 数字计数动画
// ========================================
class CountUp {
    constructor() {
        this.elements = document.querySelectorAll('.stat-number[data-target]');
        this.observed = false;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.observed) {
                    this.observed = true;
                    this.animateAll();
                }
            });
        }, { threshold: 0.5 });

        this.elements.forEach(el => observer.observe(el));
    }

    animateAll() {
        this.elements.forEach(el => this.animateNumber(el));
    }

    animateNumber(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }
}

// ========================================
// 滚动显示动画
// ========================================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('[data-aos]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-aos-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('aos-animate');
                    }, delay);
                }
            });
        }, { threshold: 0.1 });

        this.elements.forEach(el => {
            el.classList.add('aos-init');
            observer.observe(el);
        });
    }
}

// ========================================
// 标签页切换
// ========================================
class TabSwitcher {
    constructor() {
        this.tabs = document.querySelectorAll('.tab-btn');
        this.contents = document.querySelectorAll('.tab-content');
        this.init();
    }

    init() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });
    }

    switchTab(activeTab) {
        const targetId = activeTab.getAttribute('data-tab');
        
        // 更新标签按钮状态
        this.tabs.forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');
        
        // 更新内容显示
        this.contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === targetId) {
                content.classList.add('active');
            }
        });
    }
}

// ========================================
// 表单处理
// ========================================
class FormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        // 模拟提交
        const submitBtn = this.form.querySelector('.submit-button');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span>发送中...</span>';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.innerHTML = '<span>发送成功!</span>';
            submitBtn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)';
            
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                this.form.reset();
            }, 2000);
        }, 1500);
    }
}

// ========================================
// 导航高亮
// ========================================
class NavigationHighlight {
    constructor() {
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.highlightNav());
        this.highlightNav();
    }

    highlightNav() {
        let current = '';
        
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && 
                window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
}

// ========================================
// 鼠标跟随光效
// ========================================
class MouseGlow {
    constructor() {
        this.cards = document.querySelectorAll('.research-card, .project-item, .team-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleMove(e, card));
            card.addEventListener('mouseleave', () => this.handleLeave(card));
        });
    }

    handleMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    }

    handleLeave(card) {
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
    }
}

// ========================================
// 打字机效果
// ========================================
class TypeWriter {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;
    }

    type() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// ========================================
// 进度条动画
// ========================================
class ProgressAnimation {
    constructor() {
        this.progressBars = document.querySelectorAll('.progress-fill');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const width = entry.target.style.width;
                    entry.target.style.width = '0%';
                    setTimeout(() => {
                        entry.target.style.width = width;
                    }, 100);
                }
            });
        }, { threshold: 0.5 });

        this.progressBars.forEach(bar => observer.observe(bar));
    }
}

// ========================================
// 视差滚动效果
// ========================================
class ParallaxEffect {
    constructor() {
        this.elements = document.querySelectorAll('.floating-card');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll());
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        
        this.elements.forEach((el, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }
}

// ========================================
// 懒加载图片
// ========================================
class LazyLoad {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        this.images.forEach(img => observer.observe(img));
    }
}

// ========================================
// 主题切换（可选功能）
// ========================================
class ThemeToggle {
    constructor() {
        this.toggle = document.querySelector('.theme-toggle');
        this.init();
    }

    init() {
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', 
            document.body.classList.contains('light-theme') ? 'light' : 'dark'
        );
    }
}

// ========================================
// 性能优化：节流函数
// ========================================
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// 性能优化：防抖函数
// ========================================
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ========================================
// 初始化所有功能
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 粒子系统
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        new ParticleSystem(particlesContainer);
    }
    
    // 导航栏滚动
    new NavbarScroll();
    
    // 平滑滚动
    new SmoothScroll();
    
    // 数字计数
    new CountUp();
    
    // 滚动显示
    new ScrollReveal();
    
    // 标签页切换
    new TabSwitcher();
    
    // 表单处理
    new FormHandler();
    
    // 导航高亮
    new NavigationHighlight();
    
    // 鼠标光效
    new MouseGlow();
    
    // 进度条动画
    new ProgressAnimation();
    
    // 视差效果
    new ParallaxEffect();
    
    // 懒加载
    new LazyLoad();
    
    // 主题切换
    new ThemeToggle();
    
    console.log('🚀 职业教育研究网站已加载完成');
});

// ========================================
// 添加AOS动画样式
// ========================================
const style = document.createElement('style');
style.textContent = `
    .aos-init {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .aos-animate {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// ========================================
// 页面加载完成后的处理
// ========================================
window.addEventListener('load', () => {
    // 移除加载状态
    document.body.classList.add('loaded');
    
    // 延迟显示某些元素
    setTimeout(() => {
        document.querySelectorAll('.hero-content > *').forEach((el, i) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
});
