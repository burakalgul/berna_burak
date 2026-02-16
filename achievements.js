// ============================================
// ACHIEVEMENT SYSTEM
// ============================================

const ACHIEVEMENTS = {
    // İlerleme Başarımları
    first_boss: {
        id: 'first_boss',
        name: 'İlk Adım',
        desc: 'İlk boss\'u yen',
        icon: '🎯',
        check: (stats) => stats.bossesDefeated >= 1
    },
    halfway: {
        id: 'halfway',
        name: 'Yarı Yol',
        desc: '6. boss\'a ulaş',
        icon: '⭐',
        check: (stats) => stats.highestWave >= 6
    },
    final_boss: {
        id: 'final_boss',
        name: 'Son Savaş',
        desc: 'Final boss\'a ulaş',
        icon: '👑',
        check: (stats) => stats.highestWave >= 12
    },
    game_complete: {
        id: 'game_complete',
        name: 'Aşk Kazandı',
        desc: 'Oyunu bitir',
        icon: '💖',
        check: (stats) => stats.gameCompleted
    },
    
    // Beceri Başarımları
    combo_master: {
        id: 'combo_master',
        name: 'Combo Ustası',
        desc: '10x combo yap',
        icon: '🔥',
        check: (stats) => stats.longestCombo >= 10
    },
    combo_legend: {
        id: 'combo_legend',
        name: 'Combo Efsanesi',
        desc: '20x combo yap',
        icon: '⚡',
        check: (stats) => stats.longestCombo >= 20
    },
    perfect_wave: {
        id: 'perfect_wave',
        name: 'Mükemmel Dalga',
        desc: 'Bir dalgayı hasar almadan bitir',
        icon: '💎',
        check: (stats) => stats.perfectWaves >= 1
    },
    speed_demon: {
        id: 'speed_demon',
        name: 'Hız Şeytanı',
        desc: 'İlk 3 dalgayı 5 dakikada bitir',
        icon: '⚡',
        check: (stats) => stats.fastestWave3 <= 300 // 5 minutes
    },
    
    // Koleksiyon Başarımları
    heart_collector: {
        id: 'heart_collector',
        name: 'Kalp Koleksiyoncusu',
        desc: '1000 kalp yakala',
        icon: '❤️',
        check: (stats) => stats.totalHeartsCaught >= 1000
    },
    heart_master: {
        id: 'heart_master',
        name: 'Kalp Ustası',
        desc: '5000 kalp yakala',
        icon: '💕',
        check: (stats) => stats.totalHeartsCaught >= 5000
    },
    power_user: {
        id: 'power_user',
        name: 'Güç Kullanıcısı',
        desc: 'Tüm power-up\'ları kullan',
        icon: '🌟',
        check: (stats) => stats.powerUpsUsed.size >= 5
    },
    boss_slayer: {
        id: 'boss_slayer',
        name: 'Boss Avcısı',
        desc: '10 boss yen',
        icon: '⚔️',
        check: (stats) => stats.totalBossesDefeated >= 10
    },
    
    // Eğlenceli Başarımlar
    survivor: {
        id: 'survivor',
        name: 'Hayatta Kalan',
        desc: '1 canla boss yen',
        icon: '🛡️',
        check: (stats) => stats.bossDefeatedWith1HP
    },
    lucky: {
        id: 'lucky',
        name: 'Şanslı',
        desc: '5 elmas kalp yakala',
        icon: '💎',
        check: (stats) => stats.diamondHeartsCaught >= 5
    },
    unlucky: {
        id: 'unlucky',
        name: 'Şanssız',
        desc: '50 kırık kalp ye',
        icon: '💔',
        check: (stats) => stats.brokenHeartsCaught >= 50
    },
    dedicated: {
        id: 'dedicated',
        name: 'Adanmış',
        desc: '10 oyun oyna',
        icon: '🎮',
        check: (stats) => stats.totalGamesPlayed >= 10
    },
    high_scorer: {
        id: 'high_scorer',
        name: 'Yüksek Skor',
        desc: '5000 puan yap',
        icon: '🏆',
        check: (stats) => stats.highScore >= 5000
    },
    legendary: {
        id: 'legendary',
        name: 'Efsanevi',
        desc: '10000 puan yap',
        icon: '👑',
        check: (stats) => stats.highScore >= 10000
    }
};

class AchievementSystem {
    constructor() {
        this.unlockedAchievements = new Set();
        this.stats = {
            // İlerleme
            highestWave: 0,
            bossesDefeated: 0,
            totalBossesDefeated: 0,
            gameCompleted: false,
            
            // Beceri
            longestCombo: 0,
            perfectWaves: 0,
            fastestWave3: Infinity,
            
            // Koleksiyon
            totalHeartsCaught: 0,
            diamondHeartsCaught: 0,
            brokenHeartsCaught: 0,
            powerUpsUsed: new Set(),
            
            // Diğer
            totalGamesPlayed: 0,
            highScore: 0,
            bossDefeatedWith1HP: false,
            currentWaveDamage: 0 // Track damage in current wave
        };
        
        this.loadProgress();
    }
    
    // Save/Load
    saveProgress() {
        try {
            const data = {
                unlocked: Array.from(this.unlockedAchievements),
                stats: {
                    ...this.stats,
                    powerUpsUsed: Array.from(this.stats.powerUpsUsed)
                }
            };
            localStorage.setItem('burak_berna_achievements', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save achievements:', e);
        }
    }
    
    loadProgress() {
        try {
            const data = localStorage.getItem('burak_berna_achievements');
            if (data) {
                const parsed = JSON.parse(data);
                this.unlockedAchievements = new Set(parsed.unlocked || []);
                if (parsed.stats) {
                    this.stats = {
                        ...this.stats,
                        ...parsed.stats,
                        powerUpsUsed: new Set(parsed.stats.powerUpsUsed || [])
                    };
                }
            }
        } catch (e) {
            console.error('Failed to load achievements:', e);
        }
    }
    
    // Update stats
    updateStat(key, value) {
        if (key === 'powerUpsUsed') {
            this.stats.powerUpsUsed.add(value);
        } else if (typeof this.stats[key] === 'number') {
            this.stats[key] = Math.max(this.stats[key], value);
        } else {
            this.stats[key] = value;
        }
        this.checkAchievements();
        this.saveProgress();
    }
    
    incrementStat(key, amount = 1) {
        if (typeof this.stats[key] === 'number') {
            this.stats[key] += amount;
            this.checkAchievements();
            this.saveProgress();
        }
    }
    
    // Check and unlock achievements
    checkAchievements() {
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (!this.unlockedAchievements.has(id) && achievement.check(this.stats)) {
                this.unlockAchievement(id);
            }
        }
    }
    
    unlockAchievement(id) {
        if (this.unlockedAchievements.has(id)) return;
        
        this.unlockedAchievements.add(id);
        this.saveProgress();
        
        const achievement = ACHIEVEMENTS[id];
        if (achievement) {
            this.showAchievementNotification(achievement);
        }
    }
    
    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">Başarım Kazanıldı!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Play sound and haptic
        if (typeof playSound === 'function') playSound('achievement');
        if (typeof HapticFeedback !== 'undefined') HapticFeedback.success();
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    // Get progress
    getProgress() {
        const total = Object.keys(ACHIEVEMENTS).length;
        const unlocked = this.unlockedAchievements.size;
        return {
            unlocked,
            total,
            percentage: Math.round((unlocked / total) * 100)
        };
    }
    
    // Get all achievements with unlock status
    getAllAchievements() {
        return Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
            ...achievement,
            unlocked: this.unlockedAchievements.has(id)
        }));
    }
    
    // Reset (for testing)
    reset() {
        this.unlockedAchievements.clear();
        this.stats = {
            highestWave: 0,
            bossesDefeated: 0,
            totalBossesDefeated: 0,
            gameCompleted: false,
            longestCombo: 0,
            perfectWaves: 0,
            fastestWave3: Infinity,
            totalHeartsCaught: 0,
            diamondHeartsCaught: 0,
            brokenHeartsCaught: 0,
            powerUpsUsed: new Set(),
            totalGamesPlayed: 0,
            highScore: 0,
            bossDefeatedWith1HP: false,
            currentWaveDamage: 0
        };
        this.saveProgress();
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AchievementSystem, ACHIEVEMENTS };
}
