package com.careernavigator.util;

import com.careernavigator.entity.AptitudeQuestionEntity;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class AptitudeQuestionBank {

    private AptitudeQuestionBank() {}

    public static final String CAT_QUANT = "Quantitative Aptitude";
    public static final String CAT_LOGIC = "Logical Reasoning";
    public static final String CAT_VERBAL = "Verbal Ability";
    public static final String CAT_TECH = "Technical Aptitude";
    public static final String CAT_DATA = "Data Interpretation & Analytical Reasoning";

    public static final List<String> ALL_CATEGORIES = List.of(
            CAT_QUANT,
            CAT_LOGIC,
            CAT_VERBAL,
            CAT_TECH,
            CAT_DATA
    );

    public static List<AptitudeQuestionEntity> getSeedQuestions() {
        List<AptitudeQuestionEntity> list = new ArrayList<>();

        // ==========================================
        // 1. QUANTITATIVE APTITUDE (15 Questions)
        // ==========================================
        list.add(new AptitudeQuestionEntity(
                "QA-001",
                "A can complete a piece of work in 12 days and B can complete the same work in 18 days. If they work together, how many days will it take for them to finish the work?",
                CAT_QUANT,
                "Time & Work",
                "Medium",
                Arrays.asList("6 days", "7.2 days", "8 days", "9.5 days"),
                1,
                "1 day work of A = 1/12. 1 day work of B = 1/18. Combined 1 day work = 1/12 + 1/18 = (3 + 2)/36 = 5/36. Therefore, total time taken = 36/5 = 7.2 days."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-002",
                "A train 150 meters long passes an electric pole in 9 seconds. What is the speed of the train in kilometers per hour?",
                CAT_QUANT,
                "Speed, Distance & Time",
                "Easy",
                Arrays.asList("45 km/h", "54 km/h", "60 km/h", "72 km/h"),
                2,
                "Speed = Distance / Time = 150 / 9 m/s = 50/3 m/s. Converting to km/h: (50/3) * (18/5) = 10 * 6 = 60 km/h."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-003",
                "A retailer sells an article for $480, thereby earning a profit of 20%. What was the original cost price of the article?",
                CAT_QUANT,
                "Profit & Loss",
                "Easy",
                Arrays.asList("$380", "$400", "$420", "$440"),
                1,
                "Selling Price = Cost Price * (1 + Profit%). 480 = CP * 1.20 => CP = 480 / 1.20 = $400."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-004",
                "Find the compound interest on a principal of $10,000 for 2 years at an interest rate of 10% per annum, compounded annually.",
                CAT_QUANT,
                "Simple & Compound Interest",
                "Medium",
                Arrays.asList("$2,000", "$2,100", "$2,200", "$2,400"),
                1,
                "Amount = P * (1 + r/100)^t = 10000 * (1.10)^2 = 10000 * 1.21 = $12,100. Compound Interest = Amount - Principal = 12100 - 10000 = $2,100."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-005",
                "If the price of sugar increases by 25%, by what percentage must a household reduce its consumption so that the total expenditure remains unchanged?",
                CAT_QUANT,
                "Percentages",
                "Medium",
                Arrays.asList("15%", "20%", "25%", "30%"),
                1,
                "Percentage reduction in consumption = [r / (100 + r)] * 100% = [25 / (100 + 25)] * 100% = (25 / 125) * 100% = 20%."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-006",
                "If the ratio A : B is 2 : 3 and B : C is 4 : 5, what is the combined ratio A : C?",
                CAT_QUANT,
                "Ratio & Proportion",
                "Easy",
                Arrays.asList("8:15", "6:15", "2:5", "3:4"),
                0,
                "A/B = 2/3 and B/C = 4/5. Multiplying both equations: A/C = (A/B) * (B/C) = (2/3) * (4/5) = 8/15. Thus A : C = 8 : 15."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-007",
                "In how many distinct ways can all the letters of the word 'LEADER' be arranged?",
                CAT_QUANT,
                "Permutations & Combinations",
                "Medium",
                Arrays.asList("120", "360", "720", "1440"),
                1,
                "The word 'LEADER' contains 6 letters where 'E' appears twice. Distinct permutations = 6! / 2! = 720 / 2 = 360 ways."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-008",
                "Two fair six-sided dice are thrown simultaneously. What is the probability that the sum of the numbers appearing on the top faces is 8?",
                CAT_QUANT,
                "Probability",
                "Medium",
                Arrays.asList("5/36", "1/6", "7/36", "1/4"),
                0,
                "Total sample space = 6 * 6 = 36 outcomes. Favorable pairs totaling 8 are: (2,6), (3,5), (4,4), (5,3), (6,2) = 5 outcomes. Probability = 5/36."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-009",
                "The average of 5 consecutive measurements is 27. When one measurement is removed, the average of the remaining 4 measurements becomes 25. What was the value of the removed measurement?",
                CAT_QUANT,
                "Averages",
                "Easy",
                Arrays.asList("25", "30", "35", "40"),
                2,
                "Sum of initial 5 numbers = 5 * 27 = 135. Sum of remaining 4 numbers = 4 * 25 = 100. Removed value = 135 - 100 = 35."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-010",
                "What is the least positive number which, when divided by 6, 9, 12, and 18, leaves a remainder of 2 in each case?",
                CAT_QUANT,
                "Number Systems",
                "Medium",
                Arrays.asList("36", "38", "72", "74"),
                1,
                "LCM(6, 9, 12, 18) = 36. The required number = LCM + remainder = 36 + 2 = 38."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-011",
                "Inlet Pipe A can fill a reservoir in 20 hours, while Pipe B can fill it in 30 hours. If both pipes are opened simultaneously, how many hours will it take to fill the empty reservoir?",
                CAT_QUANT,
                "Pipes & Cisterns",
                "Easy",
                Arrays.asList("10 hours", "12 hours", "15 hours", "25 hours"),
                1,
                "Combined filling rate per hour = 1/20 + 1/30 = (3 + 2)/60 = 5/60 = 1/12 reservoir/hour. Hence the reservoir fills in 12 hours."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-012",
                "The ratio of the present ages of a father and son is 7 : 3. If the sum of their present ages is 60 years, what will be the son's age after 5 years?",
                CAT_QUANT,
                "Ages",
                "Easy",
                Arrays.asList("18 years", "21 years", "23 years", "25 years"),
                2,
                "Let present ages be 7x and 3x. 7x + 3x = 60 => 10x = 60 => x = 6. Son's current age = 3 * 6 = 18 years. After 5 years, son's age = 18 + 5 = 23 years."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-013",
                "A rectangular solar panel has a perimeter of 80 cm and a length of 24 cm. What is the surface area of the panel?",
                CAT_QUANT,
                "Mensuration",
                "Easy",
                Arrays.asList("360 cm²", "384 cm²", "400 cm²", "420 cm²"),
                1,
                "Perimeter = 2 * (length + width) => 80 = 2 * (24 + width) => 24 + width = 40 => width = 16 cm. Area = length * width = 24 * 16 = 384 cm²."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-014",
                "In what ratio must premium coffee beans priced at $60 per kg be blended with standard beans priced at $65 per kg to yield a blend worth $62 per kg?",
                CAT_QUANT,
                "Mixtures & Alligation",
                "Medium",
                Arrays.asList("3:2", "2:3", "3:4", "4:3"),
                0,
                "By the rule of alligation: (Price of Dearer - Mean Price) : (Mean Price - Price of Cheaper) = (65 - 62) : (62 - 60) = 3 : 2."
        ));

        list.add(new AptitudeQuestionEntity(
                "QA-015",
                "What is the acute angle formed between the hour hand and the minute hand of an analog clock at exactly 3:30?",
                CAT_QUANT,
                "Clocks & Angles",
                "Medium",
                Arrays.asList("65°", "70°", "75°", "80°"),
                2,
                "Minute hand at 30 min = 30 * 6° = 180°. Hour hand at 3:30 = (3 * 30°) + (30 * 0.5°) = 90° + 15° = 105°. Acute angle = |180° - 105°| = 75°."
        ));

        // ==========================================
        // 2. LOGICAL REASONING (15 Questions)
        // ==========================================
        list.add(new AptitudeQuestionEntity(
                "LR-001",
                "Statements:\n1. All apples are fruits.\n2. Some fruits are sweet.\nConclusions:\nI. Some apples are sweet.\nII. No apple is sweet.",
                CAT_LOGIC,
                "Syllogisms",
                "Medium",
                Arrays.asList("Only conclusion I follows", "Only conclusion II follows", "Either I or II follows", "Neither I nor II follows"),
                2,
                "Since 'Some fruits are sweet' is an I-type proposition that may or may not overlap with 'apples', conclusions I and II form a complementary pair (Some and No). Therefore, either I or II must follow."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-002",
                "Introducing a woman, a man said: 'Her father is the only son of my mother.' How is the man related to the woman?",
                CAT_LOGIC,
                "Blood Relations",
                "Easy",
                Arrays.asList("Uncle", "Brother", "Father", "Grandfather"),
                2,
                "'The only son of my mother' refers to the speaker himself. Since her father is the only son of his mother, the speaker is her father."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-003",
                "In a specific coding system, if 'COMPUTER' is encoded as 'RFUVQNPC', how is the word 'MEDICINE' encoded in that system?",
                CAT_LOGIC,
                "Coding-Decoding",
                "Hard",
                Arrays.asList("EOJDEJFM", "EOJDJEFM", "MFEDJJOE", "EOJDJFEM"),
                1,
                "Reversing 'COMPUTER' yields 'RETUPMOC'. Keeping the first and last letters 'R' and 'C' fixed and shifting each inner letter forward by +1: E->F, T->U, U->V, P->Q, M->N, O->P => 'RFUVQNPC'. Applying the same rule to 'MEDICINE': reversed is 'ENICIDEM'. Keeping 'E' and 'M' at the ends and shifting the inner letters +1: N->O, I->J, C->D, I->J, D->E, E->F => 'EOJDJEFM'."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-004",
                "A courier walks 10 km North, turns right and walks 6 km East, then turns right again and walks 10 km South. How far and in which direction is the courier relative to the starting point?",
                CAT_LOGIC,
                "Direction Sense",
                "Easy",
                Arrays.asList("6 km East", "6 km West", "10 km East", "16 km North"),
                0,
                "The 10 km North and 10 km South movements cancel each other out vertically. The horizontal displacement is 6 km East of the origin."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-005",
                "Identify the next number in the following numerical sequence: 2, 6, 12, 20, 30, 42, ___",
                CAT_LOGIC,
                "Series Completion",
                "Medium",
                Arrays.asList("52", "54", "56", "60"),
                2,
                "The differences between successive terms are +4, +6, +8, +10, +12. Following this progression, the next difference is +14. 42 + 14 = 56 (also observable as n*(n+1): 1*2, 2*3, 3*4, 4*5, 5*6, 6*7, 7*8 = 56)."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-006",
                "Five candidates (A, B, C, D, E) are seated in a row facing North. C is seated in the exact middle. A sits immediately to the left of B. D is at one of the extreme ends. If B is adjacent to C, who is seated to the immediate right of C?",
                CAT_LOGIC,
                "Seating Arrangement",
                "Medium",
                Arrays.asList("A", "B", "D", "E"),
                3,
                "Positions 1 to 5: C is in position 3. B is adjacent to C and A is immediately left of B, which requires A in position 1 and B in position 2. D is at one extreme end, which must be position 5. Candidate E therefore occupies position 4, immediately right of C."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-007",
                "Complete the analogy: Odometer is to Mileage as Compass is to: _______",
                CAT_LOGIC,
                "Analogy",
                "Easy",
                Arrays.asList("Speed", "Direction", "Altitude", "Pressure"),
                1,
                "An odometer is an instrument designed to measure mileage/distance; a compass is an instrument designed to indicate geographic direction."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-008",
                "Which number does not belong to the group: 27, 64, 125, 144, 216?",
                CAT_LOGIC,
                "Odd One Out",
                "Easy",
                Arrays.asList("27", "64", "144", "216"),
                2,
                "27 = 3³, 64 = 4³, 125 = 5³, and 216 = 6³ are all cubes of integers. 144 = 12² is a square and not the cube of an integer."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-009",
                "Statement: 'Passengers are advised to verify and collect all personal baggage before detraining.'\nAssumptions:\nI. Passengers occasionally forget personal belongings on the train.\nII. The railway operator assumes no financial liability for lost articles.",
                CAT_LOGIC,
                "Statement & Assumption",
                "Medium",
                Arrays.asList("Only assumption I is implicit", "Only assumption II is implicit", "Both I and II are implicit", "Neither I nor II is implicit"),
                0,
                "An advisory warning passengers to collect belongings implicitly assumes that without such a reminder, people may forget items (Assumption I). The statement makes no legal or liability assertions regarding operator policy (Assumption II)."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-010",
                "Evaluate the logical flaw: 'All backend developers at our firm write Java. Sarah writes Java; therefore, Sarah must be a backend developer at our firm.'",
                CAT_LOGIC,
                "Critical Reasoning",
                "Hard",
                Arrays.asList("Circular reasoning", "Affirming the consequent", "Ad hominem fallacy", "Hasty generalization"),
                1,
                "The argument takes the conditional 'If P then Q' (If backend developer -> writes Java) and invalidly deduces P from Q (Sarah writes Java -> backend developer). This is the formal fallacy of affirming the consequent."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-011",
                "On a standard fair six-sided die, opposite faces always sum to 7. If three visible adjacent faces show the values 1, 2, and 3, what are the values on their opposite opposing faces?",
                CAT_LOGIC,
                "Cube & Dice",
                "Easy",
                Arrays.asList("4, 5, 6", "3, 4, 5", "2, 4, 6", "1, 5, 6"),
                0,
                "Opposite to 1 is (7 - 1) = 6. Opposite to 2 is (7 - 2) = 5. Opposite to 3 is (7 - 3) = 4. The opposite faces are 6, 5, and 4 (or 4, 5, 6)."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-012",
                "Identify the next term in the alphanumeric pattern: A1Z, C3X, E5V, G7T, ___",
                CAT_LOGIC,
                "Alphanumeric Series",
                "Medium",
                Arrays.asList("H8S", "I9R", "I8R", "J9S"),
                1,
                "First letter advances by +2: A, C, E, G -> I. Middle number increases by +2: 1, 3, 5, 7 -> 9. Last letter regresses by -2: Z, X, V, T -> R. The next term is I9R."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-013",
                "Statements:\nI. The city authority completed resurfacing and stormwater drainage repairs across all major avenues.\nII. Traffic accidents and vehicular congestion during heavy monsoon downpours dropped by 45%.",
                CAT_LOGIC,
                "Cause and Effect",
                "Medium",
                Arrays.asList("Statement I is the cause and Statement II is its effect", "Statement II is the cause and Statement I is its effect", "Both statements are independent causes", "Both statements are effects of independent causes"),
                0,
                "Completing infrastructure repair and drainage work (Statement I) directly caused the observed drop in monsoon road accidents and waterlogged congestion (Statement II)."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-014",
                "Statement: 'Company Alpha grew its renewable energy sourcing by 40% during the current fiscal year.'\nConclusions:\nI. Company Alpha completely halted all consumption of fossil-fuel electricity.\nII. Company Alpha's overall electricity expenditure has decreased.",
                CAT_LOGIC,
                "Statement & Conclusion",
                "Medium",
                Arrays.asList("Only conclusion I follows", "Only conclusion II follows", "Either I or II follows", "Neither conclusion I nor II follows"),
                3,
                "An increase in renewable sourcing does not imply complete cessation of fossil-fuel reliance (I), nor does it guarantee lower overall electricity expenditure (II) without tariffs and total demand data. Neither follows."
        ));

        list.add(new AptitudeQuestionEntity(
                "LR-015",
                "Four professionals (Doctor, Engineer, Lawyer, Pilot) reside in four distinct cities (New York, Chicago, Boston, Seattle). The Engineer does not live in Chicago or Boston. The Lawyer lives in Seattle. The Doctor does not live in Boston. In which city does the Engineer reside?",
                CAT_LOGIC,
                "Matrix Arrangement",
                "Medium",
                Arrays.asList("New York", "Chicago", "Boston", "Seattle"),
                0,
                "Seattle is occupied by the Lawyer. The remaining cities are New York, Chicago, and Boston. The Engineer cannot live in Chicago or Boston, so the Engineer must live in New York."
        ));

        // ==========================================
        // 3. VERBAL ABILITY (15 Questions)
        // ==========================================
        list.add(new AptitudeQuestionEntity(
                "VA-001",
                "Select the grammatically correct sentence adhering to subject-verb agreement:",
                CAT_VERBAL,
                "Subject-Verb Agreement",
                "Medium",
                Arrays.asList(
                        "Neither the team lead nor the developers was aware of the system outage.",
                        "Neither the team lead nor the developers were aware of the system outage.",
                        "Neither the team lead or the developers was aware of the system outage.",
                        "Neither the team lead nor the developers is aware of the system outage."
                ),
                1,
                "When subjects are joined by 'neither... nor', the verb must agree in number with the closer subject. 'The developers' is plural, requiring the plural verb 'were'."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-002",
                "Choose the word closest in meaning (synonym) to 'METICULOUS':",
                CAT_VERBAL,
                "Synonyms",
                "Easy",
                Arrays.asList("Hasty", "Fastidious", "Indifferent", "Ambiguous"),
                1,
                "'Meticulous' means showing great attention to detail and thorough precision. 'Fastidious' is the closest synonym."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-003",
                "Choose the word most directly opposite in meaning (antonym) to 'EPHEMERAL':",
                CAT_VERBAL,
                "Antonyms",
                "Medium",
                Arrays.asList("Fleeting", "Transient", "Permanent", "Trivial"),
                2,
                "'Ephemeral' means lasting for a very short duration or transient. Its exact opposite is 'Permanent'."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-004",
                "Fill in the blank: 'Despite the engineering team's relentless effort, the release deadline had to be _______ due to unexpected third-party API deprecations.'",
                CAT_VERBAL,
                "Fill in the Blanks",
                "Easy",
                Arrays.asList("accelerated", "extended", "abbreviated", "curtailed"),
                1,
                "Because unexpected technical deprecations delayed progress, the deadline had to be moved later or 'extended'."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-005",
                "What is the meaning of the common English idiom 'to bite the bullet'?",
                CAT_VERBAL,
                "Idioms & Phrases",
                "Easy",
                Arrays.asList(
                        "To refuse to accept constructive feedback",
                        "To face a difficult or inevitable situation with fortitude",
                        "To make an impetuous and reckless financial decision",
                        "To concede defeat in an argument prematurely"
                ),
                1,
                "'To bite the bullet' means to bravely endure or confront an unavoidable hardship or painful reality."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-006",
                "Select the appropriate one-word substitution: 'A person who remains indifferent to both pain and pleasure, enduring adversity without complaint.'",
                CAT_VERBAL,
                "One Word Substitution",
                "Medium",
                Arrays.asList("Hedonist", "Stoic", "Ascetic", "Cynic"),
                1,
                "A 'Stoic' is an individual who accepts hardships or pleasures impassively without exhibiting distress or emotional agitation."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-007",
                "Arrange the four sentences in coherent logical paragraph order:\nP: This transition cuts municipal greenhouse emissions dramatically.\nQ: Cities worldwide are accelerating the electrification of transit systems.\nR: Consequently, urban ambient air quality shows quantifiable improvements.\nS: Specifically, legacy diesel bus fleets are being replaced with battery electric vehicles.",
                CAT_VERBAL,
                "Para Jumbles",
                "Hard",
                Arrays.asList("QSPR", "QPSR", "SQPR", "PQSR"),
                0,
                "Q introduces the broad topic (cities electrifying transit). S specifies the tangible action (replacing diesel buses with electric). P explains the immediate technical effect (cutting greenhouse emissions). R concludes with the resulting urban outcome (ambient air quality improvements). The logical order is QSPR."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-008",
                "Identify the segment containing a grammatical error: 'Each of the participants (A) / were presented with a certificate (B) / and an honorarium (C) / at the symposium (D).'",
                CAT_VERBAL,
                "Error Spotting",
                "Medium",
                Arrays.asList(
                        "Each of the participants (A)",
                        "were presented with a certificate (B)",
                        "and an honorarium (C)",
                        "at the symposium (D)"
                ),
                1,
                "'Each' is a singular indefinite pronoun and requires a singular verb. Part (B) should read 'was presented with a certificate' instead of 'were presented'."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-009",
                "Determine the author's tone: 'While generative AI tools undoubtedly expedite initial boilerplate authoring, adopting them without rigorous architectural review risks infusing subtle, untraceable security flaws across critical production tiers.'",
                CAT_VERBAL,
                "Critical Reading & Tone",
                "Medium",
                Arrays.asList("Unconditionally enthusiastic", "Cautiously analytical", "Dismissive and cynical", "Overly alarmist"),
                1,
                "The author balances recognition of efficiency gains with a reasoned warning about structural vulnerabilities, adopting a cautiously analytical tone."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-010",
                "Convert the sentence from active to passive voice: 'The senior architect evaluated the distributed cache architecture.'",
                CAT_VERBAL,
                "Active/Passive Voice",
                "Easy",
                Arrays.asList(
                        "The distributed cache architecture had been evaluated by the senior architect.",
                        "The distributed cache architecture was evaluated by the senior architect.",
                        "The senior architect was evaluating the distributed cache architecture.",
                        "The distributed cache architecture has been evaluated by the senior architect."
                ),
                1,
                "Simple past active 'evaluated' converts to 'was evaluated by' in the passive voice."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-011",
                "Complete the analogy based on functional structure: Epilogue : Book :: _______ : Symphony",
                CAT_VERBAL,
                "Analogies",
                "Medium",
                Arrays.asList("Prologue", "Coda", "Movement", "Overture"),
                1,
                "An epilogue is the concluding section of a literary book; a coda is the concluding musical passage that brings a symphony or movement to a formal close."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-012",
                "Identify the correctly spelled English word:",
                CAT_VERBAL,
                "Spelling",
                "Easy",
                Arrays.asList("Accomodate", "Acommodate", "Accommodate", "Acomodate"),
                2,
                "'Accommodate' is correctly spelled with double 'c' and double 'm'."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-013",
                "Transform into indirect speech: She said, 'I have completed the code review.'",
                CAT_VERBAL,
                "Direct/Indirect Speech",
                "Easy",
                Arrays.asList(
                        "She said that she has completed the code review.",
                        "She said that she had completed the code review.",
                        "She told that she was completing the code review.",
                        "She said she completes the code review."
                ),
                1,
                "In reported speech with a past tense reporting verb ('said'), present perfect ('have completed') shifts to past perfect ('had completed')."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-014",
                "Select the word that best completes the sentence: 'The candidate presented such a _______ case for the architectural refactoring that even the most skeptical stakeholders approved the proposal.'",
                CAT_VERBAL,
                "Vocabulary in Context",
                "Medium",
                Arrays.asList("convoluted", "cogent", "specious", "redundant"),
                1,
                "'Cogent' means clear, logical, and powerfully convincing, which fits the context of persuading skeptical stakeholders."
        ));

        list.add(new AptitudeQuestionEntity(
                "VA-015",
                "Choose the word that logically completes the sentence: 'Although the team encountered severe onboarding friction, their persistent agility and shared vision ultimately _______ the long-term success of the product.'",
                CAT_VERBAL,
                "Sentence Completion",
                "Easy",
                Arrays.asList("compromised", "ensured", "precluded", "undermined"),
                1,
                "The conjunction 'Although' contrasts the initial friction with the positive outcome, making 'ensured' the only coherent choice."
        ));

        // ==========================================
        // 4. TECHNICAL APTITUDE (15 Questions)
        // ==========================================
        list.add(new AptitudeQuestionEntity(
                "TA-001",
                "In Java, how do String, StringBuilder, and StringBuffer differ regarding mutability and thread safety?",
                CAT_TECH,
                "Java Core",
                "Medium",
                Arrays.asList(
                        "String is mutable; StringBuffer is immutable and thread-safe",
                        "StringBuilder is thread-safe, whereas StringBuffer is not thread-safe",
                        "StringBuffer is thread-safe via synchronized methods; StringBuilder is not synchronized",
                        "String and StringBuilder are both thread-safe; StringBuffer is deprecated"
                ),
                2,
                "String is immutable. StringBuffer is mutable and thread-safe because its public methods are synchronized. StringBuilder is mutable but unsynchronized, making it faster in single-threaded contexts."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-002",
                "In the Spring Framework, which annotation is a specialized stereotype of @Component specifically used to encapsulate business logic and transactional workflows?",
                CAT_TECH,
                "Spring Boot",
                "Easy",
                Arrays.asList("@Repository", "@Service", "@Controller", "@Configuration"),
                1,
                "@Service indicates that the annotated class holds business logic and represents the service layer. @Repository is for data access, @Controller for web routing, and @Configuration for bean declarations."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-003",
                "What are the average-case and worst-case time complexities for searching an element in a self-balancing binary search tree (such as a Red-Black Tree) containing N nodes?",
                CAT_TECH,
                "Data Structures & Algorithms",
                "Medium",
                Arrays.asList(
                        "O(1) average, O(N) worst-case",
                        "O(log N) average, O(log N) worst-case",
                        "O(log N) average, O(N) worst-case",
                        "O(N) average, O(N log N) worst-case"
                ),
                1,
                "Because self-balancing BSTs guarantee a maximum height proportional to log(N) through rotations, both average and worst-case search complexities remain strictly O(log N)."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-004",
                "In relational database ACID guarantees, what does 'Isolation' specifically ensure?",
                CAT_TECH,
                "Databases & SQL",
                "Medium",
                Arrays.asList(
                        "Ensures that all committed changes survive hardware crashes permanently",
                        "Ensures concurrent transactions execute without interfering with or observing intermediate uncommitted states of one another",
                        "Ensures all foreign key relationships remain strictly valid across table deletions",
                        "Guarantees that repeated executions of the same query produce identical result sets"
                ),
                1,
                "Isolation ensures that the concurrent execution of transactions leaves the system in the same state as if they were executed sequentially, preventing dirty reads, non-repeatable reads, or phantom reads depending on the isolation level."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-005",
                "Which implementation of the Java Set interface preserves the insertion order of elements while offering O(1) average time complexity for basic operations?",
                CAT_TECH,
                "Java Collections",
                "Easy",
                Arrays.asList("TreeSet", "HashSet", "LinkedHashSet", "ConcurrentSkipListSet"),
                2,
                "LinkedHashSet maintains a doubly-linked list through all of its entries, thus preserving insertion order while maintaining the hash table performance (O(1)) of HashSet."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-006",
                "According to HTTP/REST architectural semantics, which method is intended to be idempotent and completely replace the targeted resource representation with the request payload?",
                CAT_TECH,
                "RESTful APIs",
                "Easy",
                Arrays.asList("POST", "PUT", "PATCH", "CONNECT"),
                1,
                "PUT is defined as idempotent and replaces the entire target resource with the provided representation. PATCH is intended for partial modifications and is not guaranteed to be idempotent."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-007",
                "In concurrent programming, what situation arises when two or more threads are permanently blocked because each holds a lock that the other needs?",
                CAT_TECH,
                "Operating Systems & Concurrency",
                "Easy",
                Arrays.asList("Race condition", "Deadlock", "Livelock", "Starvation"),
                1,
                "A deadlock occurs when processes form a circular wait dependency, each holding a shared resource lock while waiting for another resource held by another process."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-008",
                "What HTTP status code should a compliant REST API return upon successfully handling a POST request that creates a new resource?",
                CAT_TECH,
                "Web & Networking",
                "Easy",
                Arrays.asList("200 OK", "201 Created", "202 Accepted", "204 No Content"),
                1,
                "HTTP status 201 Created indicates that the request was successful and resulted in the creation of one or more new resources, typically accompanied by a Location header."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-009",
                "Given tables `customers` and `orders`, which SQL construct returns all rows from `customers` regardless of whether they have placed any matching orders?",
                CAT_TECH,
                "SQL",
                "Easy",
                Arrays.asList(
                        "FROM customers INNER JOIN orders ON customers.id = orders.customer_id",
                        "FROM customers LEFT JOIN orders ON customers.id = orders.customer_id",
                        "FROM customers RIGHT JOIN orders ON customers.id = orders.customer_id",
                        "FROM customers CROSS JOIN orders"
                ),
                1,
                "A LEFT JOIN returns all rows from the left table (`customers`), filling in NULL values for columns of the right table (`orders`) if no matching relation exists."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-010",
                "In Java memory model semantics, what guarantee does the `volatile` modifier provide for a field?",
                CAT_TECH,
                "Java Concurrency",
                "Hard",
                Arrays.asList(
                        "Guarantees atomic execution for compound check-then-act operations",
                        "Guarantees that read and write operations are directly committed to main memory and visible across all threads, without acquiring locks",
                        "Prevents the enclosing object from being serialized by the JVM",
                        "Ensures that only one thread can invoke any method accessing the field"
                ),
                1,
                "The `volatile` keyword ensures visibility and ordering: any write to a volatile field happens-before every subsequent read of that field across all threads, avoiding stale cached values in CPU registers or L1/L2 caches without locking."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-011",
                "Which sorting algorithm exhibits an asymptotic worst-case time complexity of O(N log N) while maintaining stability (preserving relative order of equal elements)?",
                CAT_TECH,
                "Algorithms",
                "Medium",
                Arrays.asList("Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"),
                1,
                "Merge Sort has a deterministic time complexity of O(N log N) across best, average, and worst cases, and is stable. Quick Sort has worst case O(N²), and Heap Sort is unstable."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-012",
                "In web application security, what core purpose does a CSRF (Cross-Site Request Forgery) protection token serve?",
                CAT_TECH,
                "Web Security",
                "Medium",
                Arrays.asList(
                        "It encrypts sensitive payload parameters over unencrypted HTTP connections",
                        "It ensures that state-changing requests originate from an authorized client application rather than an unauthorized third-party site",
                        "It protects the client browser from malicious cross-site scripting (XSS) script injections",
                        "It rate-limits client IP addresses to defend against distributed denial-of-service attacks"
                ),
                1,
                "A CSRF token is an unpredictable, secret token validated on state-changing requests (POST, PUT, DELETE) to verify that the incoming command originated from the authentic user application rather than a forged cross-site request."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-013",
                "Which object-oriented principle allows a subclass to provide a specific implementation of a method defined in its superclass, executed dynamically at runtime?",
                CAT_TECH,
                "Object-Oriented Programming",
                "Easy",
                Arrays.asList("Method Overloading", "Method Overriding", "Encapsulation", "Data Abstraction"),
                1,
                "Method Overriding (runtime polymorphism) occurs when a subclass redefines an inherited instance method with the exact same signature, dispatched at runtime based on the actual object instance."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-014",
                "Which caching pattern ensures that writes are synchronously applied to both the cache and the backing database before returning confirmation to the caller?",
                CAT_TECH,
                "System Design",
                "Medium",
                Arrays.asList("Cache-Aside (Lazy Loading)", "Write-Through", "Write-Behind (Write-Back)", "Refresh-Ahead"),
                1,
                "In a Write-Through caching pattern, the application updates the cache, and the cache synchronously writes the updated data to the underlying database before returning success, ensuring immediate consistency."
        ));

        list.add(new AptitudeQuestionEntity(
                "TA-015",
                "Why is a database index on a boolean column (such as `is_active`) often ignored by the query optimizer on a large table?",
                CAT_TECH,
                "Databases & Indexing",
                "Hard",
                Arrays.asList(
                        "B-tree index structures cannot physically store boolean data types",
                        "The column has low cardinality and poor selectivity, making a sequential table scan cheaper than traversing the index and random-accessing table pages",
                        "Boolean indexes trigger immediate transactional deadlocks under concurrent write traffic",
                        "SQL standard forbids indexing columns with fewer than 10 unique values"
                ),
                1,
                "Boolean columns have a cardinality of only 2. Because an index on a low-selectivity column matches a large percentage of rows (e.g. 50%), the query optimizer recognizes that index random I/O lookups are more expensive than a simple sequential table scan."
        ));

        // ==========================================
        // 5. DATA INTERPRETATION & ANALYTICAL REASONING (15 Questions)
        // ==========================================
        list.add(new AptitudeQuestionEntity(
                "DI-001",
                "Financial data for four business divisions ($ in Millions):\n- Alpha: Revenue $120M, Expenses $80M\n- Beta: Revenue $150M, Expenses $90M\n- Gamma: Revenue $200M, Expenses $150M\n- Delta: Revenue $160M, Expenses $100M\nWhich division achieved the highest Profit Margin percentage (Profit / Revenue * 100%)?",
                CAT_DATA,
                "Tabular Data Analysis",
                "Medium",
                Arrays.asList("Alpha", "Beta", "Gamma", "Delta"),
                1,
                "Alpha: Profit = 120 - 80 = $40M; Margin = 40/120 = 33.33%.\nBeta: Profit = 150 - 90 = $60M; Margin = 60/150 = 40.00%.\nGamma: Profit = 200 - 150 = $50M; Margin = 50/200 = 25.00%.\nDelta: Profit = 160 - 100 = $60M; Margin = 60/160 = 37.50%.\nBeta achieved the highest margin at 40%."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-002",
                "An enterprise has a total annual operating budget of $2.4 Million. A pie chart distributes the expenditure as follows:\n- Engineering & R&D: 30%\n- Marketing: 25%\n- Cloud & Infrastructure: 20%\n- Salaries: 15%\n- Legal & Administration: 10%\nHow much more capital is allocated to Engineering & R&D than to Salaries?",
                CAT_DATA,
                "Pie Chart Interpretation",
                "Easy",
                Arrays.asList("$240,000", "$300,000", "$360,000", "$420,000"),
                2,
                "Difference in percentage = 30% - 15% = 15%. Total difference in dollars = 15% of $2,400,000 = 0.15 * 2,400,000 = $360,000."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-003",
                "Quarterly active subscribers for a SaaS product are recorded as follows:\n- Q1: 200,000\n- Q2: 260,000\n- Q3: 312,000\n- Q4: 390,000\nWhat was the percentage growth in active subscribers from Q1 to Q4?",
                CAT_DATA,
                "Trend & Percentage Growth",
                "Easy",
                Arrays.asList("85%", "90%", "95%", "105%"),
                2,
                "Growth = [(Q4 - Q1) / Q1] * 100% = [(390,000 - 200,000) / 200,000] * 100% = (190,000 / 200,000) * 100% = 95%."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-004",
                "A manufacturing facility produces microchips across three work shifts with the following metrics:\n- Shift A: 450 units produced, 2% defect rate\n- Shift B: 550 units produced, 4% defect rate\n- Shift C: 400 units produced, 5% defect rate\nWhat is the total number of defective microchips produced across all three shifts?",
                CAT_DATA,
                "Production & Defect Metrics",
                "Medium",
                Arrays.asList("45 units", "51 units", "56 units", "60 units"),
                1,
                "Shift A defects = 450 * 0.02 = 9 units.\nShift B defects = 550 * 0.04 = 22 units.\nShift C defects = 400 * 0.05 = 20 units.\nTotal defects = 9 + 22 + 20 = 51 units."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-005",
                "In a cohort of 100 software engineers, 65 are proficient in Java, 50 are proficient in Python, and 25 are proficient in both Java and Python. How many engineers in the cohort know neither Java nor Python?",
                CAT_DATA,
                "Venn Diagram Analysis",
                "Easy",
                Arrays.asList("5", "10", "15", "20"),
                1,
                "Number of engineers knowing at least one language = N(Java) + N(Python) - N(Java ∩ Python) = 65 + 50 - 25 = 90. Engineers proficient in neither = Total - 90 = 100 - 90 = 10."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-006",
                "A cloud data transfer service bills according to tiered monthly bandwidth:\n- Tier 1 (First 1,000 GB): Fixed base rate of $50\n- Tier 2 (Next 4,000 GB, up to 5,000 GB): $0.05 per GB\n- Tier 3 (Usage exceeding 5,000 GB): $0.03 per GB\nWhat will a customer be invoiced for consuming 6,000 GB in a single billing cycle?",
                CAT_DATA,
                "Caselet Analysis",
                "Medium",
                Arrays.asList("$260", "$280", "$300", "$320"),
                1,
                "Tier 1 (First 1,000 GB) = $50.\nTier 2 (Next 4,000 GB) = 4,000 * $0.05 = $200.\nTier 3 (Remaining 1,000 GB beyond 5,000 GB) = 1,000 * $0.03 = $30.\nTotal invoice = $50 + $200 + $30 = $280."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-007",
                "Departmental gender distribution in a software agency:\n- Backend: 48 engineers, Male to Female ratio is 3 : 1\n- Frontend: 32 engineers, Male to Female ratio is 1 : 1\n- DevOps: 20 engineers, Male to Female ratio is 4 : 1\nWhat is the simplified ratio of total Male engineers to total Female engineers across all three departments?",
                CAT_DATA,
                "Ratio in Data Sets",
                "Medium",
                Arrays.asList("15:8", "17:8", "19:8", "21:10"),
                1,
                "Backend: 48 * (3/4) = 36 Males, 12 Females.\nFrontend: 32 * (1/2) = 16 Males, 16 Females.\nDevOps: 20 * (4/5) = 16 Males, 4 Females.\nTotal Males = 36 + 16 + 16 = 68.\nTotal Females = 12 + 16 + 4 = 32.\nRatio = 68 : 32 = 17 : 8."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-008",
                "Question: Is the integer x an even number?\nStatement (1): x + 3 is an odd integer.\nStatement (2): 2x is evenly divisible by 4.\nWhich statement(s) provide sufficient data to answer the question?",
                CAT_DATA,
                "Data Sufficiency",
                "Hard",
                Arrays.asList(
                        "Statement (1) ALONE is sufficient, but Statement (2) alone is not",
                        "Statement (2) ALONE is sufficient, but Statement (1) alone is not",
                        "EACH statement ALONE is sufficient",
                        "Statements (1) and (2) TOGETHER are not sufficient"
                ),
                2,
                "From Statement (1): x + odd = odd => x must be even. Sufficient.\nFrom Statement (2): 2x is divisible by 4 => 2x = 4k => x = 2k, so x is an even integer. Sufficient.\nTherefore, each statement alone is sufficient."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-009",
                "A digital transformation initiative is evaluated across four phased milestones with assigned weights and completion statuses:\n- Phase 1 (Architecture): Weight 20%, Completed: 100%\n- Phase 2 (Core Development): Weight 30%, Completed: 80%\n- Phase 3 (Integration & QA): Weight 30%, Completed: 50%\n- Phase 4 (Deployment & Rollout): Weight 20%, Completed: 25%\nWhat is the aggregate weighted progress of the overall initiative?",
                CAT_DATA,
                "Weighted Averages",
                "Medium",
                Arrays.asList("58%", "62%", "64%", "68%"),
                2,
                "Weighted progress = (0.20 * 100%) + (0.30 * 80%) + (0.30 * 50%) + (0.20 * 25%) = 20% + 24% + 15% + 5% = 64%."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-010",
                "An inventory report shows the following unit counts for a flagship hardware sensor:\n- Beginning Inventory: 1,500 units\n- Manufactured in Q1: 12,000 units\n- Sold to Customers: 11,200 units\n- Scrapped due to shipping damage: 300 units\nWhat is the ending inventory count of operational sensors at the close of Q1?",
                CAT_DATA,
                "Inventory Reconciliation",
                "Easy",
                Arrays.asList("1,800 units", "2,000 units", "2,100 units", "2,300 units"),
                1,
                "Ending Inventory = Beginning Inventory + Units Manufactured - Units Sold - Units Scrapped = 1,500 + 12,000 - 11,200 - 300 = 2,000 units."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-011",
                "An online education platform recorded $50,000 in subscription revenue in January. Revenue grew at a consistent compounded rate of 10% month-over-month for February, March, and April. What was the subscription revenue in April?",
                CAT_DATA,
                "Compounded Trends",
                "Medium",
                Arrays.asList("$65,000", "$66,550", "$67,200", "$68,500"),
                1,
                "February = $50,000 * 1.10 = $55,000.\nMarch = $55,000 * 1.10 = $60,500.\nApril = $60,500 * 1.10 = $66,550."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-012",
                "A survey collected satisfaction ratings (on a 1 to 5 star scale) from 500 verified users:\n- 5 Stars: 200 respondents\n- 4 Stars: 150 respondents\n- 3 Stars: 80 respondents\n- 2 Stars: 40 respondents\n- 1 Star: 30 respondents\nWhat is the exact mean (weighted average) satisfaction rating?",
                CAT_DATA,
                "Survey Statistics",
                "Medium",
                Arrays.asList("3.75", "3.85", "3.90", "4.05"),
                2,
                "Total points = (200 * 5) + (150 * 4) + (80 * 3) + (40 * 2) + (30 * 1) = 1000 + 600 + 240 + 80 + 30 = 1,950 points.\nWeighted average = 1,950 / 500 = 3.90."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-013",
                "A technology company employs 1,200 full-time staff members. The organizational distribution is:\n- Software Engineering: 45%\n- Sales & Business Development: 25%\n- Product & Design: 15%\n- Cloud Operations & IT: Remainder\nHow many employees work in Cloud Operations & IT?",
                CAT_DATA,
                "Workforce Demographics",
                "Easy",
                Arrays.asList("150", "180", "200", "220"),
                1,
                "Remaining percentage = 100% - (45% + 25% + 15%) = 100% - 85% = 15%. Total employees in Cloud Operations & IT = 15% of 1,200 = 0.15 * 1,200 = 180 employees."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-014",
                "Question: What was the total gross revenue generated by Product Alpha during the preceding quarter?\nStatement (1): Product Alpha was sold at a uniform unit price of $45 throughout the quarter.\nStatement (2): Exactly 1,400 units of Product Alpha were sold during the quarter.\nWhich statement(s) are sufficient to answer the question?",
                CAT_DATA,
                "Data Sufficiency",
                "Easy",
                Arrays.asList(
                        "Statement (1) ALONE is sufficient",
                        "Statement (2) ALONE is sufficient",
                        "BOTH statements TOGETHER are sufficient, but NEITHER statement alone is sufficient",
                        "Statements (1) and (2) TOGETHER are not sufficient"
                ),
                2,
                "Gross revenue requires both price per unit and quantity sold (Revenue = $45 * 1,400 = $63,000). Neither statement alone provides both parameters, but together they are sufficient."
        ));

        list.add(new AptitudeQuestionEntity(
                "DI-015",
                "Annual profits ($ in Thousands) for four regional sales territories:\n- North: Year 1 = $300k, Year 2 = $360k\n- South: Year 1 = $200k, Year 2 = $250k\n- East: Year 1 = $400k, Year 2 = $440k\n- West: Year 1 = $100k, Year 2 = $150k\nWhat is the overall percentage growth in aggregate profits across all four territories combined from Year 1 to Year 2?",
                CAT_DATA,
                "Tabular Profit Breakdown",
                "Medium",
                Arrays.asList("18.5%", "20.0%", "22.5%", "26.25%"),
                1,
                "Year 1 Aggregate = 300 + 200 + 400 + 100 = $1,000k.\nYear 2 Aggregate = 360 + 250 + 440 + 150 = $1,200k.\nOverall Growth = [(1,200 - 1,000) / 1,000] * 100% = (200 / 1,000) * 100% = 20.0%."
        ));

        return list;
    }
}
