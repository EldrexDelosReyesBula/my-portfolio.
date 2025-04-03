        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDoiXMGFtC57-4qb1x78u_ykLjjRmOU2Lo",
            authDomain: "mynewrate-c83d6.firebaseapp.com",
            projectId: "mynewrate-c83d6",
            storageBucket: "mynewrate-c83d6.appspot.com",
            messagingSenderId: "373417760827",
            appId: "1:373417760827:web:c874bd462848f21996a41e",
            measurementId: "G-36JCLWP8YR"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        const auth = firebase.auth();

        // Sign in anonymously
        auth.signInAnonymously().catch((error) => {
            console.error("Anonymous sign-in error:", error);
        });

        // Track current user ID
        let currentUserId = null;

        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUserId = user.uid;
                console.log("Anonymous user signed in:", currentUserId);
                initializeAppFeatures();
            } else {
                console.log("User is signed out");
            }
        });

        function initializeAppFeatures() {
            // Initialize all app features after auth is ready
            initWelcomeAnimation();
            initScrollAnimations();
            initLikeButtons();
            initFollowButton();
            initBackToTop();
            initReviewStars();
            initMobileMenu();
            updateStats();
            initComments();
            initDarkMode();
        }

        // Welcome Animation with Three.js
        function initWelcomeAnimation() {
            const canvas = document.getElementById('particle-canvas');
            const welcomeText = document.getElementById('welcome-text');
            
            if (!canvas || !welcomeText) return;
            
            // Set canvas to full window size
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Three.js scene setup
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
            renderer.setClearColor(0x000000, 0);
            
            // Create particles
            const particlesGeometry = new THREE.BufferGeometry();
            const particleCount = 1500;
            
            const posArray = new Float32Array(particleCount * 3);
            
            for(let i = 0; i < particleCount * 3; i++) {
                posArray[i] = (Math.random() - 0.5) * 10;
            }
            
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            
            const particlesMaterial = new THREE.PointsMaterial({
                size: 0.02,
                color: 0x4361ee,
                transparent: true,
                opacity: 0.8
            });
            
            const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particlesMesh);
            
            camera.position.z = 3;
            
            // Animation sequence
            let stage = 0;
            let animComplete = false;
            
            function animate() {
                requestAnimationFrame(animate);
                
                if (!animComplete) {
                    // Stage 0: Initial particle spread
                    if (stage === 0) {
                        particlesMesh.rotation.x += 0.0005;
                        particlesMesh.rotation.y += 0.0005;
                        
                        // After 3 seconds, move to next stage
                        setTimeout(() => { stage = 1; }, 3000);
                    }
                    
                    // Stage 1: Particles explode outward
                    if (stage === 1) {
                        for(let i = 0; i < particleCount * 3; i++) {
                            particlesGeometry.attributes.position.array[i] *= 1.02;
                        }
                        particlesGeometry.attributes.position.needsUpdate = true;
                        
                        // When particles are far enough, show text
                        if (particlesGeometry.attributes.position.array[0] > 20) {
                            stage = 2;
                            welcomeText.textContent = "Hi, I'm Eldrex";
                            welcomeText.classList.add('animate-text-focus-in');
                            welcomeText.style.opacity = '1';
                        }
                    }
                    
                    // Stage 2: Hold text for 2 seconds
                    if (stage === 2) {
                        setTimeout(() => {
                            stage = 3;
                        }, 2000);
                    }
                    
                    // Stage 3: Fade out
                    if (stage === 3) {
                        document.getElementById('welcome-animation').style.opacity = '0';
                        setTimeout(() => {
                            document.getElementById('welcome-animation').style.display = 'none';
                            animComplete = true;
                        }, 1000);
                    }
                }
                
                renderer.render(scene, camera);
            }
            
            animate();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }
        
        // Initialize scroll animations
        function initScrollAnimations() {
            const scrollElements = document.querySelectorAll('[data-scroll]');
            
            const elementInView = (el) => {
                const elementTop = el.getBoundingClientRect().top;
                return (
                    elementTop <= (window.innerHeight || document.documentElement.clientHeight) / 1.2
                );
            };
            
            const displayScrollElement = (element) => {
                element.classList.add('is-visible');
            };
            
            const handleScrollAnimation = () => {
                scrollElements.forEach((el) => {
                    if (elementInView(el)) {
                        displayScrollElement(el);
                    }
                });
            };
            
            // Initialize
            window.addEventListener('scroll', () => {
                handleScrollAnimation();
            });
            
            // Check on load
            handleScrollAnimation();
        }
        
        // Like buttons functionality
        function initLikeButtons() {
            const likeButtons = document.querySelectorAll('.like-btn');
            
            likeButtons.forEach(button => {
                const id = button.getAttribute('data-id');
                const heartIcon = button.querySelector('i');
                const likeCount = button.querySelector('.like-count');
                
                // Listen for like changes in Firebase
                const likeRef = database.ref(`likes/${id}`);
                
                likeRef.on('value', (snapshot) => {
                    const likeData = snapshot.val() || { count: 0, users: {} };
                    likeCount.textContent = likeData.count || 0;
                    
                    if (currentUserId && likeData.users && likeData.users[currentUserId]) {
                        heartIcon.classList.remove('far');
                        heartIcon.classList.add('fas');
                        heartIcon.classList.add('text-red-500');
                    } else {
                        heartIcon.classList.remove('fas');
                        heartIcon.classList.add('far');
                        heartIcon.classList.remove('text-red-500');
                    }
                });
                
                button.addEventListener('click', function() {
                    if (!currentUserId) return;
                    
                    const likeRef = database.ref(`likes/${id}`);
                    
                    likeRef.once('value').then((snapshot) => {
                        const likeData = snapshot.val() || { count: 0, users: {} };
                        const isLiked = likeData.users && likeData.users[currentUserId];
                        
                        const updates = {};
                        if (isLiked) {
                            // Unlike
                            updates[`likes/${id}/count`] = likeData.count - 1;
                            updates[`likes/${id}/users/${currentUserId}`] = null;
                        } else {
                            // Like
                            updates[`likes/${id}/count`] = likeData.count + 1;
                            updates[`likes/${id}/users/${currentUserId}`] = true;
                        }
                        
                        database.ref().update(updates).catch((error) => {
                            console.error("Error updating like:", error);
                        });
                    });
                });
            });
        }
        
        // Follow button functionality
        function initFollowButton() {
            const followBtn = document.getElementById('follow-btn');
            const followersCount = document.getElementById('followers-count');
            
            if (!followBtn || !followersCount) return;
            
            // Listen for followers count changes
            const followersRef = database.ref('followers');
            
            followersRef.on('value', (snapshot) => {
                const followersData = snapshot.val() || { count: 0, users: {} };
                followersCount.textContent = followersData.count || 0;
                
                if (currentUserId && followersData.users && followersData.users[currentUserId]) {
                    followBtn.innerHTML = '<i class="fas fa-user-check mr-2"></i><span>Following</span>';
                } else {
                    followBtn.innerHTML = '<i class="far fa-user-plus mr-2"></i><span>Follow</span>';
                }
            });
            
            followBtn.addEventListener('click', function() {
                if (!currentUserId) return;
                
                const followersRef = database.ref('followers');
                
                followersRef.once('value').then((snapshot) => {
                    const followersData = snapshot.val() || { count: 0, users: {} };
                    const isFollowing = followersData.users && followersData.users[currentUserId];
                    
                    const updates = {};
                    if (isFollowing) {
                        // Unfollow
                        updates['followers/count'] = followersData.count - 1;
                        updates[`followers/users/${currentUserId}`] = null;
                    } else {
                        // Follow
                        updates['followers/count'] = followersData.count + 1;
                        updates[`followers/users/${currentUserId}`] = true;
                    }
                    
                    database.ref().update(updates).catch((error) => {
                        console.error("Error updating follow:", error);
                    });
                });
            });
        }
        
        // Comments functionality
        function initComments() {
            // Toggle comment sections
            document.querySelectorAll('.comment-toggle').forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const commentSection = document.getElementById(targetId);
                    commentSection.classList.toggle('hidden');
                });
            });
            
            // Submit comments
            document.querySelectorAll('.submit-comment').forEach(button => {
                button.addEventListener('click', function() {
                    const commentInput = this.previousElementSibling;
                    const contentId = commentInput.getAttribute('data-id');
                    const commentText = commentInput.value.trim();
                    
                    if (!commentText || !currentUserId) return;
                    
                    const commentsRef = database.ref(`comments/${contentId}`);
                    const newCommentRef = commentsRef.push();
                    
                    newCommentRef.set({
                        userId: currentUserId,
                        text: commentText,
                        timestamp: Date.now(),
                        username: 'Anonymous'
                    }).then(() => {
                        commentInput.value = '';
                    }).catch((error) => {
                        console.error("Error adding comment:", error);
                    });
                });
            });
            
            // Load and display comments
            document.querySelectorAll('[id^="comments-"]').forEach(commentSection => {
                const contentId = commentSection.id.replace('comments-', '');
                const commentsContainer = commentSection.querySelector('.comments-container');
                const commentCount = document.querySelector(`.comment-toggle[data-target="comments-${contentId}"] .comment-count`);
                
                database.ref(`comments/${contentId}`).on('value', (snapshot) => {
                    const commentsData = snapshot.val() || {};
                    const comments = Object.values(commentsData);
                    
                    // Update comment count
                    if (commentCount) {
                        commentCount.textContent = comments.length;
                    }
                    
                    // Display comments (limit to 5 with show more option)
                    commentsContainer.innerHTML = '';
                    const visibleComments = comments.slice(0, 5);
                    const hiddenComments = comments.slice(5);
                    
                    visibleComments.forEach(comment => {
                        const commentElement = document.createElement('div');
                        commentElement.className = 'comment';
                        commentElement.innerHTML = `
                            <div class="comment-user">${comment.username || 'Anonymous'}</div>
                            <div class="comment-text text-sm dark:text-gray-300">${comment.text}</div>
                        `;
                        commentsContainer.appendChild(commentElement);
                    });
                    
                    if (hiddenComments.length > 0) {
                        const showMoreButton = document.createElement('button');
                        showMoreButton.className = 'text-primary text-sm mt-2';
                        showMoreButton.textContent = `Show ${hiddenComments.length} more comments`;
                        showMoreButton.addEventListener('click', () => {
                            hiddenComments.forEach(comment => {
                                const commentElement = document.createElement('div');
                                commentElement.className = 'comment';
                                commentElement.innerHTML = `
                                    <div class="comment-user">${comment.username || 'Anonymous'}</div>
                                    <div class="comment-text text-sm dark:text-gray-300">${comment.text}</div>
                                `;
                                commentsContainer.appendChild(commentElement);
                            });
                            showMoreButton.remove();
                        });
                        commentsContainer.appendChild(showMoreButton);
                    }
                });
            });
        }
        
        // Back to top button
        function initBackToTop() {
            const backToTopBtn = document.getElementById('back-to-top');
            
            if (!backToTopBtn) return;
            
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.remove('opacity-0', 'invisible');
                    backToTopBtn.classList.add('opacity-100', 'visible');
                } else {
                    backToTopBtn.classList.remove('opacity-100', 'visible');
                    backToTopBtn.classList.add('opacity-0', 'invisible');
                }
            });
            
            backToTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        // Review stars functionality
        function initReviewStars() {
            const stars = document.querySelectorAll('.review-star');
            const recommendPercentage = document.getElementById('recommend-percentage');
            let selectedRating = 0;
            
            // Load reviews and calculate percentage
            database.ref('reviews').on('value', (snapshot) => {
                const reviewsData = snapshot.val() || {};
                const reviews = Object.values(reviewsData);
                
                if (reviews.length > 0) {
                    const positiveReviews = reviews.filter(review => review.rating >= 4).length;
                    const percentage = Math.round((positiveReviews / reviews.length) * 100);
                    recommendPercentage.textContent = `${percentage}% recommended`;
                }
            });
            
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    if (!currentUserId) return;
                    
                    const rating = parseInt(this.getAttribute('data-rating'));
                    selectedRating = rating;
                    
                    // Update star display
                    stars.forEach((s, index) => {
                        if (index < rating) {
                            s.classList.add('text-yellow-400');
                            s.classList.remove('far');
                            s.classList.add('fas');
                        } else {
                            s.classList.remove('text-yellow-400');
                            s.classList.add('far');
                            s.classList.remove('fas');
                        }
                    });
                    
                    // Save review to Firebase
                    const reviewsRef = database.ref('reviews');
                    const newReviewRef = reviewsRef.push();
                    
                    newReviewRef.set({
                        rating: rating,
                        userId: currentUserId,
                        timestamp: Date.now()
                    }).then(() => {
                        setTimeout(() => {
                            alert('Thank you for your review!');
                        }, 300);
                    }).catch((error) => {
                        console.error("Error saving review:", error);
                    });
                });
                
                // Hover effect
                star.addEventListener('mouseover', function() {
                    if (selectedRating === 0) {
                        const rating = parseInt(this.getAttribute('data-rating'));
                        
                        stars.forEach((s, index) => {
                            if (index < rating) {
                                s.classList.add('text-yellow-300');
                            } else {
                                s.classList.remove('text-yellow-300');
                            }
                        });
                    }
                });
                
                star.addEventListener('mouseout', function() {
                    if (selectedRating === 0) {
                        stars.forEach(s => {
                            s.classList.remove('text-yellow-300');
                        });
                    }
                });
            });
        }
        
        // Mobile menu toggle
        function initMobileMenu() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (!mobileMenuButton || !mobileMenu) return;
            
            mobileMenuButton.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
            });
            
            // Close menu when clicking on a link
            const mobileMenuLinks = mobileMenu.querySelectorAll('a');
            mobileMenuLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileMenu.classList.add('hidden');
                });
            });
        }
        
        // Update stats counters with animation
        function updateStats() {
            // Listen for stats changes in Firebase
            const statsRef = database.ref('stats');
            
            statsRef.on('value', (snapshot) => {
                const statsData = snapshot.val() || {
                    followers: 200,
                    poems: 4,
                    quotes: 100,
                    studies: 10
                };
                
                animateCounter('followers-count', statsData.followers);
                animateCounter('poems-count', statsData.poems);
                animateCounter('quotes-count', statsData.quotes);
                animateCounter('studies-count', statsData.studies);
            });
            
            function animateCounter(elementId, target) {
                const counter = document.getElementById(elementId);
                if (!counter) return;
                
                const current = parseInt(counter.textContent) || 0;
                const increment = (target - current) / 30; // Smooth animation over 30 frames
                let currentCount = current;
                
                if (current < target) {
                    const timer = setInterval(() => {
                        currentCount += increment;
                        if (currentCount >= target) {
                            clearInterval(timer);
                            currentCount = target;
                        }
                        counter.textContent = Math.floor(currentCount);
                    }, 20);
                } else {
                    counter.textContent = target;
                }
            }
        }
        
        // Dark mode based on system preference
        function initDarkMode() {
            // Check for saved user preference or use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (prefersDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            // Listen for changes in system preference
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            });
        }
