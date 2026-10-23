export interface StructuredQuestion {
  id: string;
  category: 'technical' | 'coding' | 'resume' | 'behavioral' | 'aptitude';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  roles: string[];
  question: string;
  expectedAnswerPoints: string[];
  evaluationCriteria: string[];
  codeTemplate?: string;
  defaultLanguage?: string;
}

export const QUESTION_CATEGORIES = [
  { id: 'technical', label: 'Technical Core', description: 'Language internals, architecture, databases & APIs' },
  { id: 'coding', label: 'Programming & Coding', description: 'Data structures, algorithms & syntax problem solving' },
  { id: 'resume', label: 'Project & Resume-Based', description: 'Architecture, engineering decisions & system trade-offs' },
  { id: 'behavioral', label: 'Behavioral & HR', description: 'Collaboration, conflict resolution & teamwork' },
  { id: 'aptitude', label: 'Aptitude & Analytical', description: 'Quantitative reasoning, sequence analysis & system triage' }
] as const;

export const INTERVIEW_ROLES = [
  'Java Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Python Developer',
  'Software Engineer'
] as const;

export const BUILT_IN_QUESTION_BANK: StructuredQuestion[] = [
  // --- Category 1: Technical Core (Java & Full Stack Development) ---
  {
    id: 'q-1',
    category: 'technical',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'What is the difference between JDK, JRE, and JVM?',
    expectedAnswerPoints: [
      'JVM (Java Virtual Machine) is the abstract machine executing compiled bytecode (.class files) providing platform independence.',
      'JRE (Java Runtime Environment) consists of JVM along with core libraries and runtime binaries required to run Java programs.',
      'JDK (Java Development Kit) is the complete development kit containing JRE plus development tools like javac, jdb, and jar packaging utilities.'
    ],
    evaluationCriteria: [
      'Accurate hierarchical relationship between JDK ⊃ JRE ⊃ JVM',
      'Mention of bytecode execution and platform independence (Write Once, Run Anywhere)',
      'Identification of javac compiler in JDK vs runtime execution in JRE'
    ]
  },
  {
    id: 'q-2',
    category: 'technical',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain object-oriented programming and its four main principles.',
    expectedAnswerPoints: [
      'Encapsulation: Bundling data (state) and methods (behavior) within a single unit and restricting direct field access via private modifiers and getters/setters.',
      'Abstraction: Hiding internal implementation complexities while presenting a clean, declarative interface to the consumer.',
      'Inheritance: Enabling child classes to inherit attributes and methods from a parent class for code reuse and hierarchical categorization.',
      'Polymorphism: The ability of an object to take many forms through method overloading (compile-time) and method overriding (runtime).'
    ],
    evaluationCriteria: [
      'Definition of all four pillars (Encapsulation, Abstraction, Inheritance, Polymorphism)',
      'Clear contrast between compile-time and runtime polymorphism',
      'Real-world coding example illustrating state protection through encapsulation'
    ]
  },
  {
    id: 'q-3',
    category: 'technical',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'What is the difference between an abstract class and an interface in Java?',
    expectedAnswerPoints: [
      'Multiple Inheritance: A class can implement multiple interfaces, but can extend only one abstract class.',
      'State & Variables: Abstract classes can have instance variables and state; interfaces historically only support public static final constants.',
      'Constructors: Abstract classes can have constructors invoked during subclass instantiation; interfaces cannot define constructors.',
      'Modern Java (8/9+): Interfaces now support default and static methods with bodies, plus private helper methods.'
    ],
    evaluationCriteria: [
      'Mention of multiple inheritance capability in interfaces vs single class inheritance',
      'Distinction in instance state and constructors',
      'Knowledge of Java 8+ default methods and static interface methods'
    ]
  },
  {
    id: 'q-4',
    category: 'technical',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'Explain the difference between ArrayList and LinkedList.',
    expectedAnswerPoints: [
      'Underlying Structure: ArrayList uses a dynamically resizing array; LinkedList is built upon a doubly linked list of nodes.',
      'Random Access: ArrayList provides O(1) constant-time random access by index via direct memory offset; LinkedList requires O(N) traversal.',
      'Insertion/Deletion: LinkedList offers O(1) insertion/deletion at endpoints or when an iterator is positioned; ArrayList requires O(N) array copying/shifting.',
      'Memory Overhead: LinkedList consumes more memory per element due to node pointers (prev and next references).'
    ],
    evaluationCriteria: [
      'Big-O time complexity comparison for search vs insertion/deletion',
      'Memory layout differences (contiguous memory array vs pointer overhead)',
      'Practical guidance on when to choose one over the other in production'
    ]
  },
  {
    id: 'q-5',
    category: 'technical',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'What is the difference between == and equals() in Java?',
    expectedAnswerPoints: [
      '== operator compares object memory reference addresses (identity) to determine if two variables reference the exact same memory location on the heap.',
      'equals() method evaluates logical content equivalence when properly overridden (e.g., in String, Integer, or domain entities).',
      'For primitive types, == compares literal values directly.',
      'Contract: When overriding equals(), hashCode() must also be overridden to preserve hash collection integrity (HashMap, HashSet).'
    ],
    evaluationCriteria: [
      'Clear reference equality vs value/content equivalence distinction',
      'Behavior with String pool objects vs new String() heap objects',
      'Relationship between equals() and hashCode() contract'
    ]
  },
  {
    id: 'q-6',
    category: 'technical',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'What is Spring Boot, and how does it simplify application development?',
    expectedAnswerPoints: [
      'Spring Boot is an opinionated framework built on top of Spring that eliminates boilerplate XML and annotation configuration.',
      'Auto-Configuration: Automatically configures beans and components based on jar dependencies on the classpath (@EnableAutoConfiguration).',
      'Starter Dependencies: Curated dependency packages (spring-boot-starter-web, spring-boot-starter-data-jpa) managing compatible versions.',
      'Embedded Servers: Bundles Tomcat, Jetty, or Undertow directly into a standalone runnable JAR without requiring external servlet containers.',
      'Actuator: Built-in production telemetry, health checks, and metrics monitoring.'
    ],
    evaluationCriteria: [
      'Understanding of convention-over-configuration and auto-configuration',
      'Embedded web server deployment model',
      'Starter POM dependency management'
    ]
  },
  {
    id: 'q-7',
    category: 'technical',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain REST APIs and the purpose of HTTP methods.',
    expectedAnswerPoints: [
      'REST (Representational State Transfer) is an architectural style utilizing stateless client-server communication and standard HTTP protocols.',
      'GET: Retrieve resource representations idempotently without mutating server state.',
      'POST: Create a new resource under a collection endpoint (non-idempotent).',
      'PUT: Replace an existing resource entirely or create if non-existent (idempotent).',
      'PATCH: Partially update specific fields of an existing resource.',
      'DELETE: Remove the identified resource idempotently.'
    ],
    evaluationCriteria: [
      'Accurate definitions of standard HTTP verbs (GET, POST, PUT, PATCH, DELETE)',
      'Understanding of idempotency and safety concepts',
      'Standard HTTP response status codes (200, 201, 204, 400, 401, 403, 404, 500)'
    ]
  },
  {
    id: 'q-8',
    category: 'technical',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'What is the difference between authentication and authorization?',
    expectedAnswerPoints: [
      'Authentication (AuthN) verifies WHO a user is — validating their identity through credentials (passwords, MFA tokens, biometrics, OAuth tokens).',
      'Authorization (AuthZ) determines WHAT permissions and resources an authenticated user is permitted to access (RBAC, ABAC, role scopes like ROLE_ADMIN vs ROLE_STUDENT).',
      'Workflow sequence: Authentication must always precede authorization.',
      'Implementation mechanisms: Authentication uses passwords/session cookies/JWT tokens; Authorization checks role claims or ACL policies.'
    ],
    evaluationCriteria: [
      'Crisp definition: Identity verification vs privilege enforcement',
      'Proper sequencing (authentication before authorization)',
      'Practical architectural tools (JWT claims, Spring Security @PreAuthorize, RBAC)'
    ]
  },
  {
    id: 'q-9',
    category: 'technical',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain SQL joins with a practical example.',
    expectedAnswerPoints: [
      'INNER JOIN: Returns only rows that have matching values in both joined tables.',
      'LEFT (OUTER) JOIN: Returns all records from the left table and matched records from the right table; unmatched right fields return NULL.',
      'RIGHT (OUTER) JOIN: Returns all records from the right table and matched records from the left table.',
      'FULL (OUTER) JOIN: Returns all records when there is a match in either left or right table.',
      'Example: Joining Students and Enrollments tables on StudentID to inspect who is registered in courses.'
    ],
    evaluationCriteria: [
      'Distinction between INNER vs OUTER joins with NULL value handling',
      'Syntactically and logically sound query example with ON condition',
      'Understanding of indexing on foreign keys for join performance'
    ]
  },
  {
    id: 'q-10',
    category: 'technical',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'What is the difference between GET, POST, PUT, and DELETE?',
    expectedAnswerPoints: [
      'GET requests are safe and idempotent: meant strictly for reading data without mutating state; parameters typically in URL query strings.',
      'POST creates new sub-resources; multiple identical requests result in multiple resources created (non-idempotent); parameters in request body.',
      'PUT replaces an entire targeted resource with the payload provided; repeating the request yields identical final state (idempotent).',
      'DELETE removes the specified resource; subsequent identical calls continue to leave the resource deleted (idempotent).'
    ],
    evaluationCriteria: [
      'Accurate semantic purpose for all four methods',
      'Clear definition of idempotency and safety',
      'Appropriate payload placement (query params vs request body)'
    ]
  },
  {
    id: 'q-11',
    category: 'technical',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'What is the purpose of exception handling in Java?',
    expectedAnswerPoints: [
      'Maintains normal application execution flow when abnormal conditions or runtime errors occur, preventing abrupt process crashes.',
      'Separates error-handling logic from primary business logic using try-catch-finally blocks.',
      'Checked Exceptions (subclasses of Exception excluding RuntimeException): Must be declared (throws) or caught at compile-time (e.g., IOException, SQLException).',
      'Unchecked Exceptions (subclasses of RuntimeException): Occur at runtime due to programming bugs (NullPointerException, ArrayIndexOutOfBoundsException).',
      'try-with-resources: Automatically closes AutoCloseable resources (files, sockets, database connections) cleanly.'
    ],
    evaluationCriteria: [
      'Checked vs Unchecked exception dichotomy',
      'Try-catch-finally and resource management (try-with-resources)',
      'Custom domain exception design for enterprise applications'
    ]
  },
  {
    id: 'q-12',
    category: 'technical',
    difficulty: 'advanced',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain the difference between a process and a thread.',
    expectedAnswerPoints: [
      'Process is an independent program in execution with its own dedicated memory space (heap, stack, code, data descriptors).',
      'Thread is a lightweight unit of execution within a parent process that shares the process heap and memory space, but maintains its own private stack and program counter.',
      'Context Switching: Switching between processes is computationally expensive due to MMU cache flushing; thread context switching is significantly lighter.',
      'Inter-communication: Threads communicate easily via shared memory (requiring synchronization primitives to avoid race conditions); processes require IPC (pipes, sockets, message queues).'
    ],
    evaluationCriteria: [
      'Memory isolation comparison (shared heap vs isolated process memory)',
      'Context switching overhead and CPU scheduling',
      'Synchronization and concurrency hazards (race conditions, deadlocks)'
    ]
  },

  // --- Category 2: Programming and Coding Questions ---
  {
    id: 'q-13',
    category: 'coding',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'Write a Java program to reverse a string without using a built-in reverse method.',
    expectedAnswerPoints: [
      'Use a two-pointer approach swapping characters from both ends towards the center, or iterate backward appending to a StringBuilder.',
      'Two-pointer approach on a char[] array achieves O(N) time and O(N) auxiliary space.',
      'StringBuilder avoids creating multiple immutable String instances in a loop.'
    ],
    evaluationCriteria: [
      'Correctness in reversing characters without calling StringBuilder.reverse()',
      'Efficient memory management (using char[] or StringBuilder vs string concatenation in a loop)',
      'Handling of edge cases: null, empty string, single character'
    ],
    defaultLanguage: 'java',
    codeTemplate: `public class StringReverser {
    public static String reverseString(String input) {
        if (input == null || input.length() <= 1) {
            return input;
        }
        
        char[] chars = input.toCharArray();
        int left = 0;
        int right = chars.length - 1;
        
        while (left < right) {
            char temp = chars[left];
            chars[left] = chars[right];
            chars[right] = temp;
            left++;
            right--;
        }
        
        return new String(chars);
    }

    public static void main(String[] args) {
        String test = "CareerNavigator";
        System.out.println("Original: " + test);
        System.out.println("Reversed: " + reverseString(test));
    }
}`
  },
  {
    id: 'q-14',
    category: 'coding',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Write a program to check whether a number is prime.',
    expectedAnswerPoints: [
      'A prime number is greater than 1 and has no divisors other than 1 and itself.',
      'Numbers <= 1 are not prime. 2 and 3 are prime.',
      'Optimization: Only test divisibility up to √n, since any factor greater than √n must pair with a factor less than √n.',
      'Further optimization: Check divisibility by 2 and 3 first, then step by 6 (6k ± 1) up to √n.'
    ],
    evaluationCriteria: [
      'Check up to sqrt(N) for O(√N) time complexity instead of brute-force O(N)',
      'Correct handling of negative numbers, 0, 1, and 2',
      'Clean modular function signature returning boolean'
    ],
    defaultLanguage: 'java',
    codeTemplate: `public class PrimeChecker {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        int[] tests = {1, 2, 17, 25, 97};
        for (int num : tests) {
            System.out.println(num + " is prime? " + isPrime(num));
        }
    }
}`
  },
  {
    id: 'q-15',
    category: 'coding',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Find the second-largest element in an array.',
    expectedAnswerPoints: [
      'Single-pass O(N) approach maintaining two tracking variables: largest and secondLargest.',
      'Update largest when element > largest; shift former largest to secondLargest.',
      'Update secondLargest when element > secondLargest and element != largest.',
      'Handle duplicates properly so that duplicate largest values do not mask the real distinct second largest.'
    ],
    evaluationCriteria: [
      'Single-pass O(N) time with O(1) space instead of sorting in O(N log N)',
      'Proper handling of arrays with fewer than 2 elements (throwing exception or returning Optional)',
      'Handling of all-identical elements (e.g. [5, 5, 5, 5])'
    ],
    defaultLanguage: 'java',
    codeTemplate: `public class SecondLargestFinder {
    public static Integer findSecondLargest(int[] arr) {
        if (arr == null || arr.length < 2) {
            return null; // Not enough elements
        }
        
        int largest = Integer.MIN_VALUE;
        int secondLargest = Integer.MIN_VALUE;
        boolean foundDistinct = false;
        
        for (int num : arr) {
            if (num > largest) {
                if (largest != Integer.MIN_VALUE) {
                    secondLargest = largest;
                    foundDistinct = true;
                }
                largest = num;
            } else if (num > secondLargest && num != largest) {
                secondLargest = num;
                foundDistinct = true;
            }
        }
        
        return foundDistinct ? secondLargest : null;
    }

    public static void main(String[] args) {
        int[] nums = {12, 35, 1, 10, 34, 1};
        System.out.println("Second Largest: " + findSecondLargest(nums));
    }
}`
  },
  {
    id: 'q-16',
    category: 'coding',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Check whether a string is a palindrome.',
    expectedAnswerPoints: [
      'A palindrome reads identically forward and backward (e.g. "racecar").',
      'Use two pointers from head and tail moving inward, skipping non-alphanumeric characters if case-insensitive phrase matching is desired.',
      'Time complexity is O(N) with O(1) auxiliary space.'
    ],
    evaluationCriteria: [
      'Two-pointer implementation without auxiliary reverse string creation for O(1) space',
      'Case-insensitivity handling if applicable',
      'Proper termination condition (left >= right)'
    ],
    defaultLanguage: 'java',
    codeTemplate: `public class PalindromeChecker {
    public static boolean isPalindrome(String s) {
        if (s == null) return false;
        
        int left = 0;
        int right = s.length() - 1;
        
        while (left < right) {
            // Case-insensitive alphanumeric comparison
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("A man, a plan, a canal: Panama")); // true
        System.out.println(isPalindrome("race a car")); // false
    }
}`
  },
  {
    id: 'q-17',
    category: 'coding',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Find duplicate elements in an integer array.',
    expectedAnswerPoints: [
      'Approach 1: HashSet lookup in O(N) time and O(N) space. Iterate through array; if set.add(num) returns false, it is a duplicate.',
      'Approach 2: Sort the array in O(N log N) time and O(1) auxiliary space, checking adjacent elements.',
      'Approach 3: If array values are bounded from 1 to N, use array index negation for O(N) time and O(1) space.'
    ],
    evaluationCriteria: [
      'Time and space complexity trade-offs explained clearly',
      'Handling of multiple duplicates without returning duplicate entries in the output list',
      'Clean set-based implementation'
    ],
    defaultLanguage: 'java',
    codeTemplate: `import java.util.*;

public class DuplicateFinder {
    public static Set<Integer> findDuplicates(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        Set<Integer> duplicates = new LinkedHashSet<>();
        
        for (int num : nums) {
            if (!seen.add(num)) {
                duplicates.add(num);
            }
        }
        return duplicates;
    }

    public static void main(String[] args) {
        int[] arr = {4, 3, 2, 7, 8, 2, 3, 1};
        System.out.println("Duplicates: " + findDuplicates(arr));
    }
}`
  },
  {
    id: 'q-18',
    category: 'coding',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain the time and space complexity of a solution you have written.',
    expectedAnswerPoints: [
      'Big-O notation describes the upper bound asymptotic behavior of an algorithm as input size N grows to infinity.',
      'Time Complexity: Number of fundamental machine operations performed relative to N (e.g. O(1), O(log N), O(N), O(N log N), O(N^2)).',
      'Space Complexity: Auxiliary memory allocated beyond the input parameters (stack frames in recursion, dynamic collections like HashSets/Lists).',
      'Concrete Example: Quicksort average O(N log N) time with O(log N) stack frames vs worst-case O(N^2) time.'
    ],
    evaluationCriteria: [
      'Distinction between time vs auxiliary space complexity',
      'Distinction between best, average, and worst-case scenarios',
      'Analysis of recursive call stack memory overhead'
    ],
    defaultLanguage: 'java',
    codeTemplate: `// Example: Binary Search Time & Space Complexity Analysis
public class BinarySearch {
    // Time Complexity: O(log N) - Search space is halved in every iteration.
    // Auxiliary Space Complexity: O(1) - Constant variables (left, right, mid).
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`
  },

  // --- Category 3: Resume and Project Questions ---
  {
    id: 'q-19',
    category: 'resume',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain one project you developed and the problem it solves.',
    expectedAnswerPoints: [
      'Core problem statement and business/user context.',
      'Target user demographic and why existing solutions were inadequate.',
      'High-level architectural overview: frontend interface, backend service, and data store.',
      'Concrete outcomes or measurable impact achieved by the project.'
    ],
    evaluationCriteria: [
      'Clear, articulate problem statement using STAR framework',
      'Architectural clarity connecting technical components',
      'Evidence of real engineering ownership'
    ]
  },
  {
    id: 'q-20',
    category: 'resume',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Describe your role, technical contributions, and challenges in your project.',
    expectedAnswerPoints: [
      'Specific responsibilities (e.g., API design, database schema, state management, deployment pipeline).',
      'Key technical decisions made individually vs in collaboration with team members.',
      'A notable technical roadblock encountered and the systematic debugging approach taken to overcome it.'
    ],
    evaluationCriteria: [
      'Precise identification of personal contribution vs team effort',
      'Technical depth in explaining engineering hurdles',
      'Structured problem-solving mindset'
    ]
  },
  {
    id: 'q-21',
    category: 'resume',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: "Why did you select your project's technology stack?",
    expectedAnswerPoints: [
      'Rationalized engineering trade-offs between alternative frameworks and languages.',
      'Ecosystem benefits: developer productivity, type safety, performance, community packages, and maintenance.',
      'Suitability for project constraints: e.g., React for component reusability, Spring Boot for enterprise security and JPA ORM, PostgreSQL for relational consistency.'
    ],
    evaluationCriteria: [
      'Justification grounded in technical trade-offs rather than "because it was popular"',
      'Comparison against at least one rejected alternative technology',
      'Alignment of chosen stack with project performance requirements'
    ]
  },
  {
    id: 'q-22',
    category: 'resume',
    difficulty: 'advanced',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    question: 'How would you improve the security and scalability of your project?',
    expectedAnswerPoints: [
      'Security: Input validation, parameterized queries (SQL injection prevention), CSRF tokens, strict CORS policies, bcrypt/Argon2 password hashing, and rate limiting.',
      'Scalability: Horizontal scaling behind a load balancer, Redis caching for hot read paths, database connection pooling, indexing, and asynchronous messaging (RabbitMQ/Kafka).'
    ],
    evaluationCriteria: [
      'Comprehensive security coverage (OWASP Top 10 vulnerabilities addressed)',
      'Practical architectural scaling mechanisms (caching, connection pooling, indexing)',
      'Knowledge of real-world production telemetry and monitoring'
    ]
  },
  {
    id: 'q-23',
    category: 'resume',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain a bug you encountered and how you resolved it.',
    expectedAnswerPoints: [
      'Symptoms observed and initial failure mode.',
      'Diagnostic tools and techniques applied (logs, stack traces, breakpoints, profiling).',
      'Root cause discovery (e.g., race condition, off-by-one, memory leak, unhandled null, CORS preflight mismatch).',
      'Permanent fix implemented and regression testing added to prevent recurrence.'
    ],
    evaluationCriteria: [
      'Structured debugging method (hypothesis generation and verification)',
      'Accurate technical explanation of root cause',
      'Implementation of regression guard (unit/integration test)'
    ]
  },

  // --- Category 4: Behavioral Questions ---
  {
    id: 'q-24',
    category: 'behavioral',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Tell me about yourself.',
    expectedAnswerPoints: [
      'Concise professional introduction highlighting academic background and software engineering specialization.',
      'Key technical proficiencies and notable projects completed.',
      'What drives your passion for software development and what you are seeking in your next engineering role.'
    ],
    evaluationCriteria: [
      'Professional elevator pitch delivered within 60-90 seconds',
      'Highlights technical achievements without merely reciting resume line by line',
      'Clear forward-looking ambition aligning with target job role'
    ]
  },
  {
    id: 'q-25',
    category: 'behavioral',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Why should we hire you for this position?',
    expectedAnswerPoints: [
      'Direct alignment between your verified skill set and the technical requirements of the role.',
      'Proven ability to learn emerging frameworks quickly and deliver functional systems under deadlines.',
      'Strong team-first attitude, proactive communication, and passion for engineering excellence.'
    ],
    evaluationCriteria: [
      'Compelling value proposition backed by concrete technical evidence',
      'Avoidance of generic cliches; focused on high impact and reliability',
      'Demonstrated enthusiasm for technical problem solving'
    ]
  },
  {
    id: 'q-26',
    category: 'behavioral',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Describe a technical challenge you faced and how you solved it.',
    expectedAnswerPoints: [
      'Situation: The technical environment and constraint (e.g. deadline, unfamiliar library, failing build).',
      'Task: What needed to be delivered.',
      'Action: Proactive steps taken to research, prototype, debug, and implement the solution.',
      'Result: Concrete outcome (feature delivered, latency reduced, test suite passed).'
    ],
    evaluationCriteria: [
      'Structured response adhering to the STAR method',
      'Technical problem solving and resourcefulness demonstrated',
      'Quantifiable or clear qualitative result'
    ]
  },
  {
    id: 'q-27',
    category: 'behavioral',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'How do you handle feedback or disagreements within a team?',
    expectedAnswerPoints: [
      'Active listening and separating personal ego from engineering discussions.',
      'Anchoring disagreements in factual technical data, benchmark metrics, and maintainability considerations.',
      'Willingness to build small prototypes to test competing hypotheses.',
      'Committing wholeheartedly to team consensus once a decision is finalized.'
    ],
    evaluationCriteria: [
      'Emotional maturity and collaborative mindset',
      'Objective, data-driven approach to architectural debates',
      'Receptivity to constructive critique and continuous learning'
    ]
  },
  {
    id: 'q-28',
    category: 'behavioral',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Describe a situation where you had to learn a new technology quickly.',
    expectedAnswerPoints: [
      'Context: Project requirement or urgent fix demanding an unfamiliar language, library, or tool.',
      'Learning Strategy: Official documentation, building minimal working prototypes, reading source code, and structured tutorials.',
      'Execution: Rapid integration into the project with clean design patterns and unit tests.',
      'Key takeaway: Meta-learning ability and confidence in navigating new codebases.'
    ],
    evaluationCriteria: [
      'Methodical approach to learning unfamiliar technical systems',
      'Speed and efficacy of applying new concepts to production code',
      'Resilience and adaptability'
    ]
  },
  {
    id: 'q-29',
    category: 'behavioral',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'What are your strengths and what skill are you currently improving?',
    expectedAnswerPoints: [
      'Strengths: Grounded in verifiable engineering capabilities (e.g., deep debugging persistence, clean architecture, fast algorithmic reasoning).',
      'Area for improvement: A genuine technical competency (e.g., distributed caching, container orchestration, low-level concurrency) rather than a false weakness.',
      'Action plan: Active steps being taken (reading documentation, building side projects, practicing LeetCode or system design).'
    ],
    evaluationCriteria: [
      'Honest self-awareness without self-deprecation',
      'Concrete improvement roadmap with measurable progress',
      'Professional delivery and poise'
    ]
  },

  // --- Category 5: Aptitude and Analytical Questions ---
  {
    id: 'q-30',
    category: 'aptitude',
    difficulty: 'beginner',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'A number increases from 80 to 100. What is the percentage increase?',
    expectedAnswerPoints: [
      'Formula: Percentage Increase = ((New Value - Old Value) / Old Value) * 100',
      'Calculation: (100 - 80) / 80 = 20 / 80 = 1/4 = 0.25',
      'Final Answer: 25% increase.'
    ],
    evaluationCriteria: [
      'Correct mathematical result: 25%',
      'Clear articulation of formula and intermediate step',
      'Avoidance of common error: calculating 20% by dividing by 100'
    ]
  },
  {
    id: 'q-31',
    category: 'aptitude',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Find the next number in the sequence: 2, 6, 12, 20, 30, __.',
    expectedAnswerPoints: [
      'Pattern 1 (Differences): Differences between consecutive terms are +4, +6, +8, +10. Next difference is +12. 30 + 12 = 42.',
      'Pattern 2 (Factorial/Multiplication): 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30. Next term is 6*7 = 42.',
      'Pattern 3 (n² + n): 1²+1=2, 2²+2=6, 3²+3=12, 4²+4=20, 5²+5=30. Next term is 6²+6 = 36+6 = 42.',
      'Final Answer: 42.'
    ],
    evaluationCriteria: [
      'Correct answer: 42',
      'Clear explanation of the underlying mathematical progression or difference pattern',
      'Analytical problem-solving articulation'
    ]
  },
  {
    id: 'q-32',
    category: 'aptitude',
    difficulty: 'intermediate',
    roles: ['Java Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Python Developer', 'Software Engineer'],
    question: 'If five workers complete a task in ten days at the same rate, how long would ten workers take?',
    expectedAnswerPoints: [
      'Work equation: Total Work = Workers × Days = 5 workers × 10 days = 50 worker-days of total work.',
      'New arrangement: 50 worker-days / 10 workers = 5 days.',
      'Final Answer: 5 days (inverse proportionality: doubling workers halves the required duration).'
    ],
    evaluationCriteria: [
      'Correct answer: 5 days',
      'Recognition of inverse variation (more workers = fewer days)',
      'Clear worker-day calculation methodology'
    ]
  },
  {
    id: 'q-33',
    category: 'aptitude',
    difficulty: 'advanced',
    roles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Python Developer', 'Software Engineer'],
    question: 'Explain how you would debug an application that suddenly becomes slow.',
    expectedAnswerPoints: [
      '1. Verify Metrics: Inspect server telemetry (CPU usage, memory usage, heap dumps, disk I/O, network bandwidth).',
      '2. Database Layer: Inspect slow query logs, connection pool saturation, unindexed table scans, and lock contention.',
      '3. Application Profiling: Take thread dumps to detect thread locks or deadlocks; run APM profiling to identify high-latency methods.',
      '4. External Dependencies: Verify external API/microservice response times and timeout circuit breakers.',
      '5. Traffic Analysis: Check request rate spikes or DDoS patterns; apply rate-limiting or auto-scaling if needed.'
    ],
    evaluationCriteria: [
      'Systematic, structured triage methodology from outer metrics to inner code bottlenecks',
      'Identification of common root causes: unindexed queries, database connection exhaustion, memory leak GC pauses',
      'Use of profiling tools and APM logs'
    ]
  }
];

export interface QuestionFilterOptions {
  role?: string;
  targetRole?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  count?: number;
  targetCount?: number;
  categories?: string[];
  userSkills?: string[];
  userProjects?: string[];
  resumeText?: string;
}

/**
 * Generates a balanced, randomized set of interview questions from the built-in bank,
 * tailored to the candidate's chosen role, difficulty, categories, and real resume projects/skills.
 */
export function getBalancedQuestions(options: QuestionFilterOptions): StructuredQuestion[] {
  const reqCount = options.targetCount || options.count || 5;
  const targetCount = [5, 10, 15].includes(reqCount) ? reqCount : 5;
  const targetDifficulty = options.difficulty || 'intermediate';
  const selectedCategories = (options.categories && options.categories.length > 0)
    ? options.categories
    : ['technical', 'coding', 'resume', 'behavioral', 'aptitude'];

  const targetRole = options.targetRole || options.role || 'Full Stack Developer';

  // Group candidate questions by category
  const categorizedPool: Record<string, StructuredQuestion[]> = {
    technical: [],
    coding: [],
    resume: [],
    behavioral: [],
    aptitude: []
  };

  for (const q of BUILT_IN_QUESTION_BANK) {
    if (!selectedCategories.includes(q.category)) continue;

    // Weight role alignment
    const roleMatches = q.roles.some((r) => r.toLowerCase().includes(targetRole.toLowerCase()) || targetRole.toLowerCase().includes(r.toLowerCase()));
    if (roleMatches || q.category === 'behavioral' || q.category === 'aptitude' || q.category === 'resume') {
      categorizedPool[q.category].push({ ...q });
    }
  }

  // Personalize resume/project questions using candidate's actual projects/skills
  const primaryProject = options.userProjects && options.userProjects.length > 0 ? options.userProjects[0] : null;
  const primarySkill = options.userSkills && options.userSkills.length > 0 ? options.userSkills[0] : null;

  if (categorizedPool.resume) {
    categorizedPool.resume = categorizedPool.resume.map((q) => {
      let personalizedText = q.question;
      if (primaryProject) {
        if (q.id === 'q-19') {
          personalizedText = `Explain your project "${primaryProject}" and the core problem it solves.`;
        } else if (q.id === 'q-20') {
          personalizedText = `In your project "${primaryProject}", describe your specific technical contributions and challenges.`;
        } else if (q.id === 'q-21') {
          personalizedText = `Why did you select the technology stack for your project "${primaryProject}"?`;
        }
      }
      return {
        ...q,
        question: personalizedText
      };
    });
  }

  // Target count per category
  const activeCategories = selectedCategories.filter((c) => categorizedPool[c] && categorizedPool[c].length > 0);
  const basePerCat = Math.floor(targetCount / activeCategories.length);
  let remainder = targetCount % activeCategories.length;

  const result: StructuredQuestion[] = [];
  const usedIds = new Set<string>();

  // Pick balanced slice from each active category
  for (const cat of activeCategories) {
    const pool = categorizedPool[cat];
    // Sort pool by difficulty preference
    pool.sort((a, b) => {
      const aDiffScore = a.difficulty === targetDifficulty ? 0 : 1;
      const bDiffScore = b.difficulty === targetDifficulty ? 0 : 1;
      return aDiffScore - bDiffScore || Math.random() - 0.5;
    });

    const need = basePerCat + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    let addedFromCat = 0;
    for (const item of pool) {
      if (addedFromCat >= need) break;
      if (!usedIds.has(item.id)) {
        result.push(item);
        usedIds.add(item.id);
        addedFromCat++;
      }
    }
  }

  // Fill any deficit if a category had fewer questions than required
  if (result.length < targetCount) {
    const allRemaining = BUILT_IN_QUESTION_BANK.filter((q) => !usedIds.has(q.id));
    allRemaining.sort(() => Math.random() - 0.5);
    for (const q of allRemaining) {
      if (result.length >= targetCount) break;
      result.push(q);
      usedIds.add(q.id);
    }
  }

  return result.slice(0, targetCount);
}
