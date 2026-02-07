import { getData, setData, generateKey } from './storage';

/**
 * Migrates old skills data structure to new structure
 * Old: Focus, Discipline, Health, Learning, Creativity, Social, Quest (7 skills)
 * New: Focus, Learning, Health, Creativity, Confidence, Social (6 skills)
 */
export const migrateSkills = (userId) => {
    const skillsKey = generateKey(userId, 'skills');
    const skills = getData(skillsKey, null);

    // If no skills data exists, return - will use defaults
    if (!skills || !Array.isArray(skills)) {
        return;
    }

    // Check if migration is needed (has old skills like Discipline or Quest)
    const hasOldSkills = skills.some(s => s && (s.name === 'Discipline' || s.name === 'Quest'));

    if (!hasOldSkills) {
        // Already migrated or new data
        return;
    }

    console.log('Migrating skills data from old structure to new structure...');

    // Create new skills structure
    const newSkills = [
        { name: 'Focus', currentXP: 0, level: 1 },
        { name: 'Learning', currentXP: 0, level: 1 },
        { name: 'Health', currentXP: 0, level: 1 },
        { name: 'Creativity', currentXP: 0, level: 1 },
        { name: 'Confidence', currentXP: 0, level: 1 },
        { name: 'Social', currentXP: 0, level: 1 }
    ];

    // Map old skills to new skills, preserving XP and levels where possible
    skills.forEach(oldSkill => {
        if (!oldSkill || !oldSkill.name) return;

        const newSkill = newSkills.find(s => s.name === oldSkill.name);

        if (newSkill) {
            // Skill exists in both old and new - preserve data
            newSkill.currentXP = oldSkill.currentXP || 0;
            newSkill.level = oldSkill.level || 1;
        } else if (oldSkill.name === 'Discipline') {
            // Map Discipline → Confidence
            const confidence = newSkills.find(s => s.name === 'Confidence');
            if (confidence) {
                confidence.currentXP = oldSkill.currentXP || 0;
                confidence.level = oldSkill.level || 1;
            }
        }
        // Quest skill is removed - XP is lost
    });

    // Save migrated data
    setData(skillsKey, newSkills);
    console.log('Skills migration complete!', newSkills);
};

/**
 * Migrates old habits to add skill field if missing
 */
export const migrateHabits = (userId) => {
    const habitsKey = generateKey(userId, 'habits');
    const habits = getData(habitsKey, []);

    if (!Array.isArray(habits) || habits.length === 0) {
        return;
    }

    // Check if any habit is missing the skill field
    const needsMigration = habits.some(h => h && !h.skill);

    if (!needsMigration) {
        return;
    }

    console.log('Migrating habits to add skill field...');

    // Add default skill to habits that don't have one
    const migratedHabits = habits.map(habit => {
        if (!habit) return habit;

        if (!habit.skill) {
            // Assign default skill based on category
            let defaultSkill = 'Focus';
            if (habit.category === 'Health' || habit.category === 'Wellness') {
                defaultSkill = 'Health';
            } else if (habit.category === 'Learning') {
                defaultSkill = 'Learning';
            } else if (habit.category === 'Social') {
                defaultSkill = 'Social';
            } else if (habit.category === 'Productivity') {
                defaultSkill = 'Focus';
            }

            return { ...habit, skill: defaultSkill };
        }

        return habit;
    });

    setData(habitsKey, migratedHabits);
    console.log('Habits migration complete!');
};

/**
 * Migrates old quests to add skill field if missing
 */
export const migrateQuests = (userId) => {
    const questsKey = generateKey(userId, 'quests');
    const quests = getData(questsKey, []);

    if (!Array.isArray(quests) || quests.length === 0) {
        return;
    }

    // Check if any quest is missing the skill field
    const needsMigration = quests.some(q => q && !q.skill);

    if (!needsMigration) {
        return;
    }

    console.log('Migrating quests to add skill field...');

    // Add default skill to quests that don't have one
    const migratedQuests = quests.map(quest => {
        if (!quest) return quest;

        if (!quest.skill) {
            return { ...quest, skill: 'Focus' };
        }

        return quest;
    });

    setData(questsKey, migratedQuests);
    console.log('Quests migration complete!');
};

/**
 * Run all migrations for a user
 */
export const runMigrations = (userId) => {
    if (!userId) return;

    try {
        migrateSkills(userId);
        migrateHabits(userId);
        migrateQuests(userId);
    } catch (error) {
        console.error('Migration error:', error);
    }
};
