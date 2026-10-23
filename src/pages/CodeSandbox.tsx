import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../lib/api.js';
import {
  Play,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Code2,
  Terminal,
  Cpu,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
}

const SAMPLE_PROBLEMS: Problem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    starterCode: {
      javascript: `// Two Sum - Find indices of two numbers that sum to target
function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  
  return [];
}

// Test runner:
console.log("Result:", twoSum([2, 7, 11, 15], 9));
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}
console.log("Result:", twoSum([2, 7, 11, 15], 9));
`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    prev_map = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in prev_map:
            return [prev_map[diff], i]
        prev_map[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))
`,
      java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> prev;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (prev.count(complement)) {
                return {prev[complement], i};
            }
            prev[nums[i]] = i;
        }
        return {};
    }
};
`
    }
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    category: 'Strings',
    description:
      'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' }
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    starterCode: {
      javascript: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  
  const count = {};
  for (let char of s) count[char] = (count[char] || 0) + 1;
  for (let char of t) {
    if (!count[char]) return false;
    count[char]--;
  }
  return true;
}

console.log("Test 1:", isAnagram("anagram", "nagaram"));
console.log("Test 2:", isAnagram("rat", "car"));
`,
      typescript: `function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count: Record<string, number> = {};
  for (const char of s) count[char] = (count[char] || 0) + 1;
  for (const char of t) {
    if (!count[char]) return false;
    count[char]--;
  }
  return true;
}
console.log("Result:", isAnagram("anagram", "nagaram"));
`,
      python: `def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    from collections import Counter
    return Counter(s) == Counter(t)

print(is_anagram("anagram", "nagaram"))
`,
      java: `import java.util.Arrays;

class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        char[] sChars = s.toCharArray();
        char[] tChars = t.toCharArray();
        Arrays.sort(sChars);
        Arrays.sort(tChars);
        return Arrays.equals(sChars, tChars);
    }
}
`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        sort(s.begin(), s.end());
        sort(t.begin(), t.end());
        return s == t;
    }
};
`
    }
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Medium',
    category: 'Linked Lists',
    description:
      'Given the `head` of a singly linked list, reverse the list, and return the reversed list.\n\nA linked list can be reversed either iteratively or recursively. Could you implement both?',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' }
    ],
    constraints: ['The number of nodes in the list is in the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    starterCode: {
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let curr = head;
  
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  
  return prev;
}

// Build list 1 -> 2 -> 3
const list = new ListNode(1, new ListNode(2, new ListNode(3)));
const reversed = reverseList(list);
console.log("Reversed head val:", reversed.val);
`,
      typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}
`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode) -> ListNode:
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
`,
      java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}
`,
      cpp: `struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};
`
    }
  }
];

interface CodeReviewResult {
  correctness: number;
  timeComplexity: string;
  spaceComplexity: string;
  feedback: string;
  suggestions: string[];
}

export default function CodeSandbox() {
  const [selectedProblem, setSelectedProblem] = useState<Problem>(SAMPLE_PROBLEMS[0]);
  const [language, setLanguage] = useState<'javascript' | 'typescript' | 'python' | 'java' | 'cpp'>('javascript');
  const [code, setCode] = useState(SAMPLE_PROBLEMS[0].starterCode.javascript);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [executing, setExecuting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);

  // Update starter code when problem or language changes
  useEffect(() => {
    setCode(selectedProblem.starterCode[language] || '// Write your solution here...');
    setConsoleOutput('');
    setReviewResult(null);
  }, [selectedProblem, language]);

  // Execute JavaScript in sandboxed iframe with captured logs
  const handleRunCode = () => {
    if (language !== 'javascript') {
      setConsoleOutput(`[Execution Note]: Direct in-browser runtime is currently enabled for JavaScript. For ${language.toUpperCase()}, click 'AI Code Review' to verify algorithmic correctness, edge cases, and Big-O efficiency.`);
      return;
    }

    setExecuting(true);
    setConsoleOutput('Executing in isolated sandbox...\n');

    try {
      const logs: string[] = [];
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.sandbox.add('allow-scripts'); // Security: no allow-same-origin to prevent privilege escalation
      document.body.appendChild(iframe);

      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SANDBOX_OUTPUT') {
          logs.push(event.data.text);
          setConsoleOutput(logs.join('\n'));
        }
      };

      window.addEventListener('message', handleMessage);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body>
          <script>
            (function() {
              const origLog = console.log;
              const origError = console.error;
              console.log = function(...args) {
                const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                window.parent.postMessage({ type: 'SANDBOX_OUTPUT', text: '[LOG]: ' + text }, '*');
              };
              console.error = function(...args) {
                const text = args.map(a => String(a)).join(' ');
                window.parent.postMessage({ type: 'SANDBOX_OUTPUT', text: '[ERROR]: ' + text }, '*');
              };
              try {
                ${code}
                window.parent.postMessage({ type: 'SANDBOX_OUTPUT', text: '✨ Execution completed successfully with 0 errors.' }, '*');
              } catch (err) {
                window.parent.postMessage({ type: 'SANDBOX_OUTPUT', text: '❌ Runtime Error: ' + err.message }, '*');
              }
            })();
          </script>
        </body>
        </html>
      `;

      iframe.srcdoc = htmlContent;

      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        setExecuting(false);
      }, 1500);

    } catch (err: any) {
      setConsoleOutput(`Execution failed: ${err.message}`);
      setExecuting(false);
    }
  };

  // Submit code for AI assessment
  const handleReviewCode = async () => {
    if (!code.trim()) return;

    setReviewing(true);
    try {
      const response = await api.post('/api/interview/code-review', {
        code,
        language,
        problemStatement: `${selectedProblem.title}\n\n${selectedProblem.description}`
      });

      if (!response.ok) {
        throw new Error('Failed to submit code for AI evaluation.');
      }

      const data = await response.json();
      const rawReview = data.review !== undefined ? data.review : (data.correctness !== undefined ? data : null);
      if (rawReview) {
        setReviewResult({
          correctness: typeof rawReview.correctness === 'number' ? rawReview.correctness : 0,
          timeComplexity: rawReview.timeComplexity || 'O(N)',
          spaceComplexity: rawReview.spaceComplexity || 'O(1)',
          feedback: rawReview.feedback || '',
          suggestions: Array.isArray(rawReview.suggestions) ? rawReview.suggestions : []
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error running AI code review.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4 text-[var(--text-primary)] min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-display">
              Code Lab — Live Technical Interview Round
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Interactive Monaco Editor with algorithmic time-complexity review and sandbox execution.
            </p>
          </div>
        </div>

        {/* Problem selector tabs */}
        <div className="flex items-center space-x-2">
          {SAMPLE_PROBLEMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProblem(p)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                selectedProblem.id === p.id
                  ? 'bg-[var(--primary)] text-white shadow-none'
                  : 'bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
        {/* Left Column: Problem description + AI Review */}
        <div className="lg:col-span-5 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* Problem Details */}
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-[var(--text-primary)] font-display">
                  {selectedProblem.title}
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[var(--success-soft)] border border-[var(--success)]/30 text-[var(--success)]">
                  {selectedProblem.difficulty}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                {selectedProblem.category}
              </span>
            </div>

            <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-3 font-sans">
              <p className="whitespace-pre-line">{selectedProblem.description}</p>

              {/* Examples */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Example Cases
                </span>
                {selectedProblem.examples.map((ex, i) => (
                  <div key={i} className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-3 font-mono text-[11px] space-y-1">
                    <p><span className="text-[var(--text-muted)]">Input:</span> <span className="text-[var(--text-primary)]">{ex.input}</span></p>
                    <p><span className="text-[var(--text-muted)]">Output:</span> <span className="text-[var(--primary)] font-bold">{ex.output}</span></p>
                    {ex.explanation && (
                      <p className="text-[var(--text-secondary)] text-[10px]">{ex.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Constraints
                </span>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] text-[11px] font-mono">
                  {selectedProblem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI Code Review Panel (when evaluated) */}
          {reviewResult && (
            <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    AI Algorithmic Audit
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)]">
                  {reviewResult.correctness}% Correctness
                </span>
              </div>

              {/* Complexity badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--bg-base)] border border-[var(--border)] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block flex items-center justify-center space-x-1">
                    <Clock className="w-3 h-3 text-[var(--primary)]" />
                    <span>Time Complexity</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--primary)] mt-0.5 block">
                    {reviewResult.timeComplexity}
                  </span>
                </div>
                <div className="bg-[var(--bg-base)] border border-[var(--border)] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block flex items-center justify-center space-x-1">
                    <HardDrive className="w-3 h-3 text-[var(--accent)]" />
                    <span>Space Complexity</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--accent)] mt-0.5 block">
                    {reviewResult.spaceComplexity}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-base)] p-3 rounded-xl border border-[var(--border)]">
                  {reviewResult.feedback}
                </p>

                {(reviewResult.suggestions || []).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">Optimization Tips:</span>
                    {(reviewResult.suggestions || []).map((s, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-[11px] text-[var(--text-secondary)]">
                        <span className="text-[var(--primary)] font-bold">•</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Monaco Editor + Terminal Output */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Editor Header */}
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-mono text-[var(--text-secondary)] font-bold">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="javascript">JavaScript (Node ES6)</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python 3</option>
                <option value="java">Java (JDK 21)</option>
                <option value="cpp">C++ (GCC 14)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCode(selectedProblem.starterCode[language] || '')}
                aria-label="Reset code to starter template"
                title="Reset starter template"
                className="p-1.5 rounded-lg bg-transparent hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                onClick={handleRunCode}
                disabled={executing}
                className="inline-flex items-center space-x-1.5 bg-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-semibold text-xs px-3.5 py-1.5 rounded-xl border border-[var(--border)] transition"
              >
                <Play className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]" />
                <span>{executing ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                onClick={handleReviewCode}
                disabled={reviewing}
                className="inline-flex items-center space-x-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-1.5 rounded-xl transition"
              >
                {reviewing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>AI Code Review</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-[var(--border)] bg-[#1e1e1e] min-h-[350px]">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              theme="vs-dark"
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>

          {/* Terminal / Output Console */}
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 space-y-2 h-44 flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
              <div className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
                <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Execution Output Console</span>
              </div>
              <button
                onClick={() => setConsoleOutput('')}
                aria-label="Clear execution console output"
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono transition"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-[var(--text-secondary)] p-2 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] whitespace-pre-wrap">
              {consoleOutput || <span className="text-[var(--text-muted)]">Click "Run Code" to execute in sandbox or "AI Code Review" to test algorithmic bounds...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
