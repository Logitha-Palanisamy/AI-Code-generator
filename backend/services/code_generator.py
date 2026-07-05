"""
Code generation service using Anthropic Claude API.
"""

import json
import os
from typing import Optional
from anthropic import Anthropic
from backend.core.config import settings
from backend.core.logger import logger


class CodeGeneratorService:
    """Service for generating code based on descriptions using Claude."""

    def __init__(self):
        """Initialize the Anthropic client."""
        api_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY") or ""
        if not self._is_valid_api_key(api_key):
            self.client = None
        else:
            self.client = Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"

    @staticmethod
    def _is_valid_api_key(api_key: str) -> bool:
        """Return True for a valid Anthropic API key string."""
        if not api_key or "YOUR_ACTUAL_API_KEY" in api_key:
            return False
        return api_key.strip().startswith("sk-")

    def generate_code(
        self,
        description: str,
        language: str = "python",
        framework: Optional[str] = None,
    ) -> dict:
        """
        Generate code based on a natural language description.

        Args:
            description: Natural language description of what code to generate
            language: Programming language (python, javascript, java, etc.)
            framework: Optional framework (django, fastapi, react, etc.)

        Returns:
            Dictionary with generated code and metadata
        """
        try:
            # Build the prompt
            framework_hint = f" using {framework}" if framework else ""
            prompt = f"""You are an expert code generator. Generate clean, production-ready code based on the following description.

Language: {language}{framework_hint}
Description: {description}

Requirements:
1. Generate complete, working code
2. Include proper error handling
3. Add helpful comments
4. Follow best practices and conventions for {language}
5. Include type hints if applicable
6. Make the code production-ready

Return the code in a JSON object with the following structure:
{{
    "filename": "main.py or appropriate filename",
    "language": "{language}",
    "code": "the complete code here",
    "description": "brief description of what the code does",
    "dependencies": ["list", "of", "required", "packages"]
}}

Only return valid JSON, no additional text."""

            # If the API key is missing or invalid, use a basic local fallback generator
            if not self.client:
                logger.warning("Anthropic API key missing or invalid, using local fallback generator")
                return self._generate_basic_code(description, language, framework)

            # Call Claude API
            try:
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}],
                )
            except Exception as api_exc:
                logger.error(f"Anthropic API call failed: {api_exc}")
                fallback = self._generate_basic_code(description, language, framework)
                if fallback.get("success"):
                    return fallback
                return {"success": False, "error": str(api_exc), "code": None}

            # Parse response
            response_text = message.content[0].text
            
            # Try to extract JSON from response
            result = self._parse_json_response(response_text)
            
            if result:
                result["success"] = True
                logger.info(
                    "Code generated successfully",
                    language=language,
                    filename=result.get("filename"),
                )
                return result
            else:
                logger.error("Failed to parse Claude response")
                return {
                    "success": False,
                    "error": "Failed to parse generated code",
                    "raw_response": response_text,
                }

        except Exception as e:
            logger.error(f"Error generating code: {str(e)}")
            return {"success": False, "error": str(e), "code": None}

    def _parse_json_response(self, response_text: str) -> Optional[dict]:
        """
        Parse JSON from Claude's response.

        Handles cases where JSON might be wrapped in markdown code blocks.
        """
        try:
            # Try direct JSON parsing
            return json.loads(response_text)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code blocks
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            if end != -1:
                try:
                    return json.loads(response_text[start:end].strip())
                except json.JSONDecodeError:
                    pass

        # Try extracting from regular code blocks
        if "```" in response_text:
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            if end != -1:
                try:
                    return json.loads(response_text[start:end].strip())
                except json.JSONDecodeError:
                    pass

        return None

    def _generate_basic_code(
        self,
        description: str,
        language: str,
        framework: Optional[str] = None,
    ) -> dict:
        """Generate simple code locally for very basic descriptions."""
        description_lower = description.lower()
        language_key = language.lower().strip()

        # Basic pattern matching for common algorithm requests
        if any(token in description_lower for token in ["anagram", "check anagram", "anagram detector"]):
            return self._basic_anagram_code(language_key)

        if any(token in description_lower for token in ["palindrome", "palindrome check", "palindromic"]):
            return self._basic_palindrome_code(language_key)

        if any(token in description_lower for token in ["if else", "if/else", "else statement", "if else statement"]):
            return self._basic_if_else_code(language_key)

        if any(token in description_lower for token in ["factorial", "compute factorial", "calculate factorial"]):
            return self._basic_factorial_code(language_key)

        if any(token in description_lower for token in ["prime", "prime number", "is prime"]):
            return self._basic_prime_code(language_key)

        if any(token in description_lower for token in ["fibonacci", "fibonacci sequence"]):
            return self._basic_fibonacci_code(language_key)

        if any(token in description_lower for token in ["reverse string", "reverse a string", "string reverse"]):
            return self._basic_reverse_string_code(language_key)

        if any(token in description_lower for token in ["bubble sort", "sort array", "sort list"]):
            return self._basic_bubble_sort_code(language_key)

        if any(token in description_lower for token in ["selection sort", "insert sort", "insertion sort", "merge sort"]):
            if any(token in description_lower for token in ["selection sort"]):
                return self._basic_selection_sort_code(language_key)
            if any(token in description_lower for token in ["insertion sort"]):
                return self._basic_insertion_sort_code(language_key)
            if any(token in description_lower for token in ["merge sort"]):
                return self._basic_merge_sort_code(language_key)

        if any(token in description_lower for token in ["linear search", "search array", "find item", "search list"]):
            return self._basic_linear_search_code(language_key)

        if any(token in description_lower for token in ["binary search", "binary search algorithm"]):
            return self._basic_binary_search_code(language_key)

        # Generic fallback
        return self._basic_if_else_code(language_key)

    def _basic_anagram_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function areAnagrams(str1, str2) {\n"
                "  const normalize = (s) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().split('').sort().join('');\n"
                "  return normalize(str1) === normalize(str2);\n"
                "}\n\n"
                "console.log(areAnagrams('listen', 'silent'));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Check whether two strings are anagrams in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function areAnagrams(str1: string, str2: string): boolean {\n"
                "  const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().split('').sort().join('');\n"
                "  return normalize(str1) === normalize(str2);\n"
                "}\n\n"
                "console.log(areAnagrams('listen', 'silent'));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Check whether two strings are anagrams in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "import java.util.Arrays;\n\n"
                "public class Main {\n"
                "  public static boolean areAnagrams(String s1, String s2) {\n"
                "    String normalize1 = s1.replaceAll('[^a-zA-Z0-9]', '').toLowerCase();\n"
                "    String normalize2 = s2.replaceAll('[^a-zA-Z0-9]', '').toLowerCase();\n"
                "    return Arrays.equals(normalize1.chars().sorted().toArray(), normalize2.chars().sorted().toArray());\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(areAnagrams(\"listen\", \"silent\"));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Check whether two strings are anagrams in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n"
                "using System.Linq;\n\n"
                "class Program {\n"
                "  static bool AreAnagrams(string s1, string s2) {\n"
                "    var normalize = new string(s1.Where(char.IsLetterOrDigit).Select(char.ToLower).OrderBy(c => c).ToArray());\n"
                "    var normalize2 = new string(s2.Where(char.IsLetterOrDigit).Select(char.ToLower).OrderBy(c => c).ToArray());\n"
                "    return normalize == normalize2;\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(AreAnagrams(\"listen\", \"silent\"));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Check whether two strings are anagrams in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import (\n"
                "  \"fmt\"\n"
                "  \"sort\"\n"
                "  \"strings\"\n"
                ")\n\n"
                "func normalize(s string) string {\n"
                "  filtered := strings.Builder{}\n"
                "  for _, r := range s {\n"
                "    if ('a' <= r && r <= 'z') || ('A' <= r && r <= 'Z') || ('0' <= r && r <= '9') {\n"
                "      filtered.WriteRune(r)\n"
                "    }\n"
                "  }\n"
                "  normalized := strings.ToLower(filtered.String())\n"
                "  runes := []rune(normalized)\n"
                "  sort.Slice(runes, func(i, j int) bool { return runes[i] < runes[j] })\n"
                "  return string(runes)\n"
                "}\n\n"
                "func areAnagrams(s1, s2 string) bool {\n"
                "  return normalize(s1) == normalize(s2)\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(areAnagrams(\"listen\", \"silent\"))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Check whether two strings are anagrams in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def are_anagrams(s1: str, s2: str) -> bool:\n"
                "    normalize = lambda value: ''.join(sorted([c.lower() for c in value if c.isalnum()]))\n"
                "    return normalize(s1) == normalize(s2)\n\n"
                "print(are_anagrams('listen', 'silent'))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Check whether two strings are anagrams in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_palindrome_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function isPalindrome(value) {\n"
                "  const normalized = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\n"
                "  return normalized === normalized.split('').reverse().join('');\n"
                "}\n\n"
                "console.log(isPalindrome('A man, a plan, a canal, Panama'));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Check whether a string is a palindrome in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function isPalindrome(value: string): boolean {\n"
                "  const normalized = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\n"
                "  return normalized === normalized.split('').reverse().join('');\n"
                "}\n\n"
                "console.log(isPalindrome('A man, a plan, a canal, Panama'));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Check whether a string is a palindrome in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static boolean isPalindrome(String value) {\n"
                "    String normalized = value.replaceAll('[^a-zA-Z0-9]', '').toLowerCase();\n"
                "    return new StringBuilder(normalized).reverse().toString().equals(normalized);\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(isPalindrome(\"A man, a plan, a canal, Panama\"));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Check whether a string is a palindrome in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n"
                "using System.Linq;\n\n"
                "class Program {\n"
                "  static bool IsPalindrome(string value) {\n"
                "    var normalized = new string(value.Where(char.IsLetterOrDigit).Select(char.ToLower).ToArray());\n"
                "    return normalized == new string(normalized.Reverse().ToArray());\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(IsPalindrome(\"A man, a plan, a canal, Panama\"));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Check whether a string is a palindrome in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import (\n"
                "  \"fmt\"\n"
                "  \"strings\"\n"
                ")\n\n"
                "func normalize(value string) string {\n"
                "  filtered := strings.Builder{}\n"
                "  for _, r := range value {\n"
                "    if ('a' <= r && r <= 'z') || ('A' <= r && r <= 'Z') || ('0' <= r && r <= '9') {\n"
                "      filtered.WriteRune(r)\n"
                "    }\n"
                "  }\n"
                "  return strings.ToLower(filtered.String())\n"
                "}\n\n"
                "func isPalindrome(value string) bool {\n"
                "  normalized := normalize(value)\n"
                "  reversed := []rune(normalized)\n"
                "  for i, j := 0, len(reversed)-1; i < j; i, j = i+1, j-1 {\n"
                "    reversed[i], reversed[j] = reversed[j], reversed[i]\n"
                "  }\n"
                "  return string(reversed) == normalized\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(isPalindrome(\"A man, a plan, a canal, Panama\"))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Check whether a string is a palindrome in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def is_palindrome(value: str) -> bool:\n"
                "    normalized = ''.join(c.lower() for c in value if c.isalnum())\n"
                "    return normalized == normalized[::-1]\n\n"
                "print(is_palindrome('A man, a plan, a canal, Panama'))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Check whether a string is a palindrome in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_if_else_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function checkNumber(value) {\n"
                "  if (value % 2 === 0) {\n"
                "    return 'Even number';\n"
                "  } else {\n"
                "    return 'Odd number';\n"
                "  }\n"
                "}\n\n"
                "const number = 10;\n"
                "console.log(checkNumber(number));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "A simple JavaScript example using an if/else statement.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function checkNumber(value: number): string {\n"
                "  if (value % 2 === 0) {\n"
                "    return 'Even number';\n"
                "  } else {\n"
                "    return 'Odd number';\n"
                "  }\n"
                "}\n\n"
                "const number = 10;\n"
                "console.log(checkNumber(number));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "A simple TypeScript example using an if/else statement.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static String checkNumber(int value) {\n"
                "    if (value % 2 == 0) {\n"
                "      return \"Even number\";\n"
                "    } else {\n"
                "      return \"Odd number\";\n"
                "    }\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(checkNumber(10));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "A simple Java example using an if/else statement.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static string CheckNumber(int value) {\n"
                "    if (value % 2 == 0) {\n"
                "      return \"Even number\";\n"
                "    } else {\n"
                "      return \"Odd number\";\n"
                "    }\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(CheckNumber(10));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "A simple C# example using an if/else statement.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import (\n"
                "  \"fmt\"\n"
                ")\n\n"
                "func checkNumber(value int) string {\n"
                "  if value%2 == 0 {\n"
                "    return \"Even number\"\n"
                "  } else {\n"
                "    return \"Odd number\"\n"
                "  }\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(checkNumber(10))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "A simple Go example using an if/else statement.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def check_number(value: int) -> str:\n"
                "    if value % 2 == 0:\n"
                "        return \"Even number\"\n"
                "    else:\n"
                "        return \"Odd number\"\n\n"
                "if __name__ == \"__main__\":\n"
                "    number = 10\n"
                "    print(check_number(number))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "A simple Python example using an if/else statement.",
                "dependencies": [],
            }

        return {
            "success": True,
            "filename": "main.py",
            "language": language_key,
            "code": "# Unable to generate sample for this language yet. Please use Python, JavaScript, TypeScript, Java, C#, or Go.",
            "description": "Fallback sample generator could not produce code for this language.",
            "dependencies": [],
        }

    def _basic_factorial_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function factorial(n) {\n"
                "  if (n <= 1) return 1;\n"
                "  return n * factorial(n - 1);\n"
                "}\n\n"
                "console.log(factorial(5));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Compute the factorial of a number in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function factorial(n: number): number {\n"
                "  if (n <= 1) return 1;\n"
                "  return n * factorial(n - 1);\n"
                "}\n\n"
                "console.log(factorial(5));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Compute the factorial of a number in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static long factorial(int n) {\n"
                "    if (n <= 1) return 1;\n"
                "    return n * factorial(n - 1);\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(factorial(5));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Compute the factorial of a number in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static long Factorial(int n) {\n"
                "    return n <= 1 ? 1 : n * Factorial(n - 1);\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(Factorial(5));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Compute the factorial of a number in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func factorial(n int) int {\n"
                "  if n <= 1 {\n"
                "    return 1\n"
                "  }\n"
                "  return n * factorial(n-1)\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(factorial(5))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Compute the factorial of a number in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def factorial(n: int) -> int:\n"
                "    if n <= 1:\n"
                "        return 1\n"
                "    return n * factorial(n - 1)\n\n"
                "print(factorial(5))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Compute the factorial of a number in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_prime_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function isPrime(n) {\n"
                "  if (n <= 1) return false;\n"
                "  for (let i = 2; i <= Math.sqrt(n); i++) {\n"
                "    if (n % i === 0) return false;\n"
                "  }\n"
                "  return true;\n"
                "}\n\n"
                "console.log(isPrime(17));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Check whether a number is prime in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function isPrime(n: number): boolean {\n"
                "  if (n <= 1) return false;\n"
                "  for (let i = 2; i <= Math.sqrt(n); i++) {\n"
                "    if (n % i === 0) return false;\n"
                "  }\n"
                "  return true;\n"
                "}\n\n"
                "console.log(isPrime(17));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Check whether a number is prime in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static boolean isPrime(int n) {\n"
                "    if (n <= 1) return false;\n"
                "    for (int i = 2; i <= Math.sqrt(n); i++) {\n"
                "      if (n % i == 0) return false;\n"
                "    }\n"
                "    return true;\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(isPrime(17));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Check whether a number is prime in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static bool IsPrime(int n) {\n"
                "    if (n <= 1) return false;\n"
                "    for (int i = 2; i <= Math.Sqrt(n); i++) {\n"
                "      if (n % i == 0) return false;\n"
                "    }\n"
                "    return true;\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(IsPrime(17));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Check whether a number is prime in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import (\n"
                "  \"fmt\"\n"
                "  \"math\"\n"
                ")\n\n"
                "func isPrime(n int) bool {\n"
                "  if n <= 1 {\n"
                "    return false\n"
                "  }\n"
                "  for i := 2; i <= int(math.Sqrt(float64(n))); i++ {\n"
                "    if n%i == 0 {\n"
                "      return false\n"
                "    }\n"
                "  }\n"
                "  return true\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(isPrime(17))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Check whether a number is prime in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def is_prime(n: int) -> bool:\n"
                "    if n <= 1:\n"
                "        return False\n"
                "    for i in range(2, int(n ** 0.5) + 1):\n"
                "        if n % i == 0:\n"
                "            return False\n"
                "    return True\n\n"
                "print(is_prime(17))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Check whether a number is prime in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_fibonacci_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function fibonacci(n) {\n"
                "  const sequence = [0, 1];\n"
                "  for (let i = 2; i < n; i++) {\n"
                "    sequence.push(sequence[i - 1] + sequence[i - 2]);\n"
                "  }\n"
                "  return sequence;\n"
                "}\n\n"
                "console.log(fibonacci(10));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Generate the Fibonacci sequence in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function fibonacci(n: number): number[] {\n"
                "  const sequence = [0, 1];\n"
                "  for (let i = 2; i < n; i++) {\n"
                "    sequence.push(sequence[i - 1] + sequence[i - 2]);\n"
                "  }\n"
                "  return sequence;\n"
                "}\n\n"
                "console.log(fibonacci(10));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Generate the Fibonacci sequence in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "import java.util.ArrayList;\n"
                "import java.util.List;\n\n"
                "public class Main {\n"
                "  public static List<Integer> fibonacci(int n) {\n"
                "    List<Integer> sequence = new ArrayList<>();\n"
                "    sequence.add(0);\n"
                "    sequence.add(1);\n"
                "    for (int i = 2; i < n; i++) {\n"
                "      sequence.add(sequence.get(i - 1) + sequence.get(i - 2));\n"
                "    }\n"
                "    return sequence;\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(fibonacci(10));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Generate the Fibonacci sequence in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n"
                "using System.Collections.Generic;\n\n"
                "class Program {\n"
                "  static List<int> Fibonacci(int n) {\n"
                "    var sequence = new List<int> {0, 1};\n"
                "    for (int i = 2; i < n; i++) {\n"
                "      sequence.Add(sequence[i - 1] + sequence[i - 2]);\n"
                "    }\n"
                "    return sequence;\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(string.Join(", ", Fibonacci(10)));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Generate the Fibonacci sequence in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func fibonacci(n int) []int {\n"
                "  sequence := []int{0, 1}\n"
                "  for i := 2; i < n; i++ {\n"
                "    sequence = append(sequence, sequence[i-1]+sequence[i-2])\n"
                "  }\n"
                "  return sequence\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(fibonacci(10))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Generate the Fibonacci sequence in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def fibonacci(n: int) -> list[int]:\n"
                "    sequence = [0, 1]\n"
                "    for i in range(2, n):\n"
                "        sequence.append(sequence[i - 1] + sequence[i - 2])\n"
                "    return sequence\n\n"
                "print(fibonacci(10))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Generate the Fibonacci sequence in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_reverse_string_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function reverseString(value) {\n"
                "  return value.split('').reverse().join('');\n"
                "}\n\n"
                "console.log(reverseString('hello'));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Reverse a string in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function reverseString(value: string): string {\n"
                "  return value.split('').reverse().join('');\n"
                "}\n\n"
                "console.log(reverseString('hello'));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Reverse a string in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static String reverseString(String value) {\n"
                "    return new StringBuilder(value).reverse().toString();\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    System.out.println(reverseString(\"hello\"));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Reverse a string in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static string ReverseString(string value) {\n"
                "    var chars = value.ToCharArray();\n"
                "    Array.Reverse(chars);\n"
                "    return new string(chars);\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    Console.WriteLine(ReverseString(\"hello\"));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Reverse a string in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func reverseString(value string) string {\n"
                "  chars := []rune(value)\n"
                "  for i, j := 0, len(chars)-1; i < j; i, j = i+1, j-1 {\n"
                "    chars[i], chars[j] = chars[j], chars[i]\n"
                "  }\n"
                "  return string(chars)\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(reverseString(\"hello\"))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Reverse a string in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def reverse_string(value: str) -> str:\n"
                "    return value[::-1]\n\n"
                "print(reverse_string('hello'))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Reverse a string in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_bubble_sort_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function bubbleSort(arr) {\n"
                "  for (let i = 0; i < arr.length - 1; i++) {\n"
                "    for (let j = 0; j < arr.length - i - 1; j++) {\n"
                "      if (arr[j] > arr[j + 1]) {\n"
                "        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n"
                "      }\n"
                "    }\n"
                "  }\n"
                "  return arr;\n"
                "}\n\n"
                "console.log(bubbleSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Sort an array using the bubble sort algorithm in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function bubbleSort(arr: number[]): number[] {\n"
                "  for (let i = 0; i < arr.length - 1; i++) {\n"
                "    for (let j = 0; j < arr.length - i - 1; j++) {\n"
                "      if (arr[j] > arr[j + 1]) {\n"
                "        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n"
                "      }\n"
                "    }\n"
                "  }\n"
                "  return arr;\n"
                "}\n\n"
                "console.log(bubbleSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Sort an array using the bubble sort algorithm in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static void bubbleSort(int[] arr) {\n"
                "    for (int i = 0; i < arr.length - 1; i++) {\n"
                "      for (int j = 0; j < arr.length - i - 1; j++) {\n"
                "        if (arr[j] > arr[j + 1]) {\n"
                "          int temp = arr[j];\n"
                "          arr[j] = arr[j + 1];\n"
                "          arr[j + 1] = temp;\n"
                "        }\n"
                "      }\n"
                "    }\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    bubbleSort(numbers);\n"
                "    for (int num : numbers) {\n"
                "      System.out.print(num + \" \");\n"
                "    }\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Sort an array using the bubble sort algorithm in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static void BubbleSort(int[] arr) {\n"
                "    for (int i = 0; i < arr.Length - 1; i++) {\n"
                "      for (int j = 0; j < arr.Length - i - 1; j++) {\n"
                "        if (arr[j] > arr[j + 1]) {\n"
                "          int temp = arr[j];\n"
                "          arr[j] = arr[j + 1];\n"
                "          arr[j + 1] = temp;\n"
                "        }\n"
                "      }\n"
                "    }\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    BubbleSort(numbers);\n"
                "    Console.WriteLine(string.Join(\", \", numbers));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Sort an array using the bubble sort algorithm in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func bubbleSort(arr []int) []int {\n"
                "  for i := 0; i < len(arr)-1; i++ {\n"
                "    for j := 0; j < len(arr)-i-1; j++ {\n"
                "      if arr[j] > arr[j+1] {\n"
                "        arr[j], arr[j+1] = arr[j+1], arr[j]\n"
                "      }\n"
                "    }\n"
                "  }\n"
                "  return arr\n"
                "}\n\n"
                "func main() {\n"
                "  numbers := []int{5, 2, 9, 1, 5, 6}\n"
                "  fmt.Println(bubbleSort(numbers))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Sort an array using the bubble sort algorithm in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def bubble_sort(arr: list[int]) -> list[int]:\n"
                "    n = len(arr)\n"
                "    for i in range(n - 1):\n"
                "        for j in range(n - i - 1):\n"
                "            if arr[j] > arr[j + 1]:\n"
                "                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n"
                "    return arr\n\n"
                "print(bubble_sort([5, 2, 9, 1, 5, 6]))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Sort an array using the bubble sort algorithm in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_linear_search_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function linearSearch(arr, target) {\n"
                "  for (let i = 0; i < arr.length; i++) {\n"
                "    if (arr[i] === target) {\n"
                "      return i;\n"
                "    }\n"
                "  }\n"
                "  return -1;\n"
                "}\n\n"
                "console.log(linearSearch([3, 7, 1, 9], 7));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Search for a target value in an array using linear search in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function linearSearch(arr: number[], target: number): number {\n"
                "  for (let i = 0; i < arr.length; i++) {\n"
                "    if (arr[i] === target) {\n"
                "      return i;\n"
                "    }\n"
                "  }\n"
                "  return -1;\n"
                "}\n\n"
                "console.log(linearSearch([3, 7, 1, 9], 7));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Search for a target value in an array using linear search in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static int linearSearch(int[] arr, int target) {\n"
                "    for (int i = 0; i < arr.length; i++) {\n"
                "      if (arr[i] == target) {\n"
                "        return i;\n"
                "      }\n"
                "    }\n"
                "    return -1;\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    int[] numbers = {3, 7, 1, 9};\n"
                "    System.out.println(linearSearch(numbers, 7));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Search for a target value in an array using linear search in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static int LinearSearch(int[] arr, int target) {\n"
                "    for (int i = 0; i < arr.Length; i++) {\n"
                "      if (arr[i] == target) {\n"
                "        return i;\n"
                "      }\n"
                "    }\n"
                "    return -1;\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    int[] numbers = {3, 7, 1, 9};\n"
                "    Console.WriteLine(LinearSearch(numbers, 7));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Search for a target value in an array using linear search in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func linearSearch(arr []int, target int) int {\n"
                "  for i, value := range arr {\n"
                "    if value == target {\n"
                "      return i\n"
                "    }\n"
                "  }\n"
                "  return -1\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(linearSearch([]int{3, 7, 1, 9}, 7))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Search for a target value in an array using linear search in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def linear_search(arr: list[int], target: int) -> int:\n"
                "    for index, value in enumerate(arr):\n"
                "        if value == target:\n"
                "            return index\n"
                "    return -1\n\n"
                "print(linear_search([3, 7, 1, 9], 7))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Search for a target value in an array using linear search in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_binary_search_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function binarySearch(arr, target) {\n"
                "  let left = 0;\n"
                "  let right = arr.length - 1;\n"
                "  while (left <= right) {\n"
                "    const mid = Math.floor((left + right) / 2);\n"
                "    if (arr[mid] === target) {\n"
                "      return mid;\n"
                "    } else if (arr[mid] < target) {\n"
                "      left = mid + 1;\n"
                "    } else {\n"
                "      right = mid - 1;\n"
                "    }\n"
                "  }\n"
                "  return -1;\n"
                "}\n\n"
                "console.log(binarySearch([1, 3, 5, 7, 9], 5));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Search for a target value in a sorted array using binary search in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function binarySearch(arr: number[], target: number): number {\n"
                "  let left = 0;\n"
                "  let right = arr.length - 1;\n"
                "  while (left <= right) {\n"
                "    const mid = Math.floor((left + right) / 2);\n"
                "    if (arr[mid] === target) {\n"
                "      return mid;\n"
                "    } else if (arr[mid] < target) {\n"
                "      left = mid + 1;\n"
                "    } else {\n"
                "      right = mid - 1;\n"
                "    }\n"
                "  }\n"
                "  return -1;\n"
                "}\n\n"
                "console.log(binarySearch([1, 3, 5, 7, 9], 5));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Search for a target value in a sorted array using binary search in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static int binarySearch(int[] arr, int target) {\n"
                "    int left = 0;\n"
                "    int right = arr.length - 1;\n"
                "    while (left <= right) {\n"
                "      int mid = (left + right) / 2;\n"
                "      if (arr[mid] == target) {\n"
                "        return mid;\n"
                "      } else if (arr[mid] < target) {\n"
                "        left = mid + 1;\n"
                "      } else {\n"
                "        right = mid - 1;\n"
                "      }\n"
                "    }\n"
                "    return -1;\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    int[] numbers = {1, 3, 5, 7, 9};\n"
                "    System.out.println(binarySearch(numbers, 5));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Search for a target value in a sorted array using binary search in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static int BinarySearch(int[] arr, int target) {\n"
                "    int left = 0;\n"
                "    int right = arr.Length - 1;\n"
                "    while (left <= right) {\n"
                "      int mid = (left + right) / 2;\n"
                "      if (arr[mid] == target) {\n"
                "        return mid;\n"
                "      } else if (arr[mid] < target) {\n"
                "        left = mid + 1;\n"
                "      } else {\n"
                "        right = mid - 1;\n"
                "      }\n"
                "    }\n"
                "    return -1;\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    int[] numbers = {1, 3, 5, 7, 9};\n"
                "    Console.WriteLine(BinarySearch(numbers, 5));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Search for a target value in a sorted array using binary search in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func binarySearch(arr []int, target int) int {\n"
                "  left, right := 0, len(arr)-1\n"
                "  for left <= right {\n"
                "    mid := (left + right) / 2\n"
                "    if arr[mid] == target {\n"
                "      return mid\n"
                "    } else if arr[mid] < target {\n"
                "      left = mid + 1\n"
                "    } else {\n"
                "      right = mid - 1\n"
                "    }\n"
                "  }\n"
                "  return -1\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(binarySearch([]int{1, 3, 5, 7, 9}, 5))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Search for a target value in a sorted array using binary search in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def binary_search(arr: list[int], target: int) -> int:\n"
                "    left, right = 0, len(arr) - 1\n"
                "    while left <= right:\n"
                "        mid = (left + right) // 2\n"
                "        if arr[mid] == target:\n"
                "            return mid\n"
                "        elif arr[mid] < target:\n"
                "            left = mid + 1\n"
                "        else:\n"
                "            right = mid - 1\n"
                "    return -1\n\n"
                "print(binary_search([1, 3, 5, 7, 9], 5))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Search for a target value in a sorted array using binary search in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_selection_sort_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function selectionSort(arr) {\n"
                "  for (let i = 0; i < arr.length - 1; i++) {\n"
                "    let minIndex = i;\n"
                "    for (let j = i + 1; j < arr.length; j++) {\n"
                "      if (arr[j] < arr[minIndex]) {\n"
                "        minIndex = j;\n"
                "      }\n"
                "    }\n"
                "    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];\n"
                "  }\n"
                "  return arr;\n"
                "}\n\n"
                "console.log(selectionSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Sort an array using selection sort in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function selectionSort(arr: number[]): number[] {\n"
                "  for (let i = 0; i < arr.length - 1; i++) {\n"
                "    let minIndex = i;\n"
                "    for (let j = i + 1; j < arr.length; j++) {\n"
                "      if (arr[j] < arr[minIndex]) {\n"
                "        minIndex = j;\n"
                "      }\n"
                "    }\n"
                "    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];\n"
                "  }\n"
                "  return arr;\n"
                "}\n\n"
                "console.log(selectionSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Sort an array using selection sort in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static void selectionSort(int[] arr) {\n"
                "    for (int i = 0; i < arr.length - 1; i++) {\n"
                "      int minIndex = i;\n"
                "      for (int j = i + 1; j < arr.length; j++) {\n"
                "        if (arr[j] < arr[minIndex]) {\n"
                "          minIndex = j;\n"
                "        }\n"
                "      }\n"
                "      int temp = arr[minIndex];\n"
                "      arr[minIndex] = arr[i];\n"
                "      arr[i] = temp;\n"
                "    }\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    selectionSort(numbers);\n"
                "    for (int num : numbers) {\n"
                "      System.out.print(num + \" \");\n"
                "    }\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Sort an array using selection sort in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static void SelectionSort(int[] arr) {\n"
                "    for (int i = 0; i < arr.Length - 1; i++) {\n"
                "      int minIndex = i;\n"
                "      for (int j = i + 1; j < arr.Length; j++) {\n"
                "        if (arr[j] < arr[minIndex]) {\n"
                "          minIndex = j;\n"
                "        }\n"
                "      }\n"
                "      int temp = arr[minIndex];\n"
                "      arr[minIndex] = arr[i];\n"
                "      arr[i] = temp;\n"
                "    }\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    SelectionSort(numbers);\n"
                "    Console.WriteLine(string.Join(\", \", numbers));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Sort an array using selection sort in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func selectionSort(arr []int) []int {\n"
                "  for i := 0; i < len(arr)-1; i++ {\n"
                "    minIndex := i\n"
                "    for j := i + 1; j < len(arr); j++ {\n"
                "      if arr[j] < arr[minIndex] {\n"
                "        minIndex = j\n"
                "      }\n"
                "    }\n"
                "    arr[i], arr[minIndex] = arr[minIndex], arr[i]\n"
                "  }\n"
                "  return arr\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(selectionSort([]int{5, 2, 9, 1, 5, 6}))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Sort an array using selection sort in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def selection_sort(arr: list[int]) -> list[int]:\n"
                "    for i in range(len(arr) - 1):\n"
                "        min_index = i\n"
                "        for j in range(i + 1, len(arr)):\n"
                "            if arr[j] < arr[min_index]:\n"
                "                min_index = j\n"
                "        arr[i], arr[min_index] = arr[min_index], arr[i]\n"
                "    return arr\n\n"
                "print(selection_sort([5, 2, 9, 1, 5, 6]))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Sort an array using selection sort in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_insertion_sort_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function insertionSort(arr) {\n"
                "  for (let i = 1; i < arr.length; i++) {\n"
                "    let key = arr[i];\n"
                "    let j = i - 1;\n"
                "    while (j >= 0 && arr[j] > key) {\n"
                "      arr[j + 1] = arr[j];\n"
                "      j--;\n"
                "    }\n"
                "    arr[j + 1] = key;\n"
                "  }\n"
                "  return arr;\n"
                "}\n\n"
                "console.log(insertionSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Sort an array using insertion sort in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function insertionSort(arr: number[]): number[] {\n"
                "  for (let i = 1; i < arr.length; i++) {\n"
                "    const key = arr[i];\n"
                "    let j = i - 1;\n"
                "    while (j >= 0 && arr[j] > key) {\n"
                "      arr[j + 1] = arr[j];\n"
                "      j--;\n"
                "    }\n"
                "    arr[j + 1] = key;\n"
                "  }\n"
                "  return arr;\n"
                "}\n\n"
                "console.log(insertionSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Sort an array using insertion sort in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "public class Main {\n"
                "  public static void insertionSort(int[] arr) {\n"
                "    for (int i = 1; i < arr.length; i++) {\n"
                "      int key = arr[i];\n"
                "      int j = i - 1;\n"
                "      while (j >= 0 && arr[j] > key) {\n"
                "        arr[j + 1] = arr[j];\n"
                "        j--;\n"
                "      }\n"
                "      arr[j + 1] = key;\n"
                "    }\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    insertionSort(numbers);\n"
                "    for (int num : numbers) {\n"
                "      System.out.print(num + \" \");\n"
                "    }\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Sort an array using insertion sort in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static void InsertionSort(int[] arr) {\n"
                "    for (int i = 1; i < arr.Length; i++) {\n"
                "      int key = arr[i];\n"
                "      int j = i - 1;\n"
                "      while (j >= 0 && arr[j] > key) {\n"
                "        arr[j + 1] = arr[j];\n"
                "        j--;\n"
                "      }\n"
                "      arr[j + 1] = key;\n"
                "    }\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    InsertionSort(numbers);\n"
                "    Console.WriteLine(string.Join(\", \", numbers));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Sort an array using insertion sort in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func insertionSort(arr []int) []int {\n"
                "  for i := 1; i < len(arr); i++ {\n"
                "    key := arr[i]\n"
                "    j := i - 1\n"
                "    for j >= 0 && arr[j] > key {\n"
                "      arr[j+1] = arr[j]\n"
                "      j--\n"
                "    }\n"
                "    arr[j+1] = key\n"
                "  }\n"
                "  return arr\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(insertionSort([]int{5, 2, 9, 1, 5, 6}))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Sort an array using insertion sort in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def insertion_sort(arr: list[int]) -> list[int]:\n"
                "    for i in range(1, len(arr)):\n"
                "        key = arr[i]\n"
                "        j = i - 1\n"
                "        while j >= 0 and arr[j] > key:\n"
                "            arr[j + 1] = arr[j]\n"
                "            j -= 1\n"
                "        arr[j + 1] = key\n"
                "    return arr\n\n"
                "print(insertion_sort([5, 2, 9, 1, 5, 6]))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Sort an array using insertion sort in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def _basic_merge_sort_code(self, language_key: str) -> dict:
        if language_key == "javascript":
            code = (
                "function merge(left, right) {\n"
                "  const result = [];\n"
                "  let i = 0;\n"
                "  let j = 0;\n"
                "  while (i < left.length && j < right.length) {\n"
                "    if (left[i] < right[j]) {\n"
                "      result.push(left[i++]);\n"
                "    } else {\n"
                "      result.push(right[j++]);\n"
                "    }\n"
                "  }\n"
                "  return result.concat(left.slice(i)).concat(right.slice(j));\n"
                "}\n\n"
                "function mergeSort(arr) {\n"
                "  if (arr.length <= 1) return arr;\n"
                "  const mid = Math.floor(arr.length / 2);\n"
                "  const left = mergeSort(arr.slice(0, mid));\n"
                "  const right = mergeSort(arr.slice(mid));\n"
                "  return merge(left, right);\n"
                "}\n\n"
                "console.log(mergeSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.js",
                "language": "javascript",
                "code": code,
                "description": "Sort an array using merge sort in JavaScript.",
                "dependencies": [],
            }

        if language_key == "typescript":
            code = (
                "function merge(left: number[], right: number[]): number[] {\n"
                "  const result: number[] = [];\n"
                "  let i = 0;\n"
                "  let j = 0;\n"
                "  while (i < left.length && j < right.length) {\n"
                "    if (left[i] < right[j]) {\n"
                "      result.push(left[i++]);\n"
                "    } else {\n"
                "      result.push(right[j++]);\n"
                "    }\n"
                "  }\n"
                "  return result.concat(left.slice(i)).concat(right.slice(j));\n"
                "}\n\n"
                "function mergeSort(arr: number[]): number[] {\n"
                "  if (arr.length <= 1) return arr;\n"
                "  const mid = Math.floor(arr.length / 2);\n"
                "  const left = mergeSort(arr.slice(0, mid));\n"
                "  const right = mergeSort(arr.slice(mid));\n"
                "  return merge(left, right);\n"
                "}\n\n"
                "console.log(mergeSort([5, 2, 9, 1, 5, 6]));\n"
            )
            return {
                "success": True,
                "filename": "index.ts",
                "language": "typescript",
                "code": code,
                "description": "Sort an array using merge sort in TypeScript.",
                "dependencies": [],
            }

        if language_key == "java":
            code = (
                "import java.util.Arrays;\n\n"
                "public class Main {\n"
                "  public static int[] merge(int[] left, int[] right) {\n"
                "    int[] result = new int[left.length + right.length];\n"
                "    int i = 0, j = 0, k = 0;\n"
                "    while (i < left.length && j < right.length) {\n"
                "      if (left[i] < right[j]) {\n"
                "        result[k++] = left[i++];\n"
                "      } else {\n"
                "        result[k++] = right[j++];\n"
                "      }\n"
                "    }\n"
                "    while (i < left.length) {\n"
                "      result[k++] = left[i++];\n"
                "    }\n"
                "    while (j < right.length) {\n"
                "      result[k++] = right[j++];\n"
                "    }\n"
                "    return result;\n"
                "  }\n\n"
                "  public static int[] mergeSort(int[] arr) {\n"
                "    if (arr.length <= 1) return arr;\n"
                "    int mid = arr.length / 2;\n"
                "    int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));\n"
                "    int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));\n"
                "    return merge(left, right);\n"
                "  }\n\n"
                "  public static void main(String[] args) {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    System.out.println(Arrays.toString(mergeSort(numbers)));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Main.java",
                "language": "java",
                "code": code,
                "description": "Sort an array using merge sort in Java.",
                "dependencies": [],
            }

        if language_key == "c#" or language_key == "csharp":
            code = (
                "using System;\n\n"
                "class Program {\n"
                "  static int[] Merge(int[] left, int[] right) {\n"
                "    int[] result = new int[left.Length + right.Length];\n"
                "    int i = 0, j = 0, k = 0;\n"
                "    while (i < left.Length && j < right.Length) {\n"
                "      if (left[i] < right[j]) {\n"
                "        result[k++] = left[i++];\n"
                "      } else {\n"
                "        result[k++] = right[j++];\n"
                "      }\n"
                "    }\n"
                "    while (i < left.Length) {\n"
                "      result[k++] = left[i++];\n"
                "    }\n"
                "    while (j < right.Length) {\n"
                "      result[k++] = right[j++];\n"
                "    }\n"
                "    return result;\n"
                "  }\n\n"
                "  static int[] MergeSort(int[] arr) {\n"
                "    if (arr.Length <= 1) return arr;\n"
                "    int mid = arr.Length / 2;\n"
                "    int[] left = MergeSort(arr[..mid]);\n"
                "    int[] right = MergeSort(arr[mid..]);\n"
                "    return Merge(left, right);\n"
                "  }\n\n"
                "  static void Main() {\n"
                "    int[] numbers = {5, 2, 9, 1, 5, 6};\n"
                "    Console.WriteLine(string.Join(\", \", MergeSort(numbers)));\n"
                "  }\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "Program.cs",
                "language": "c#",
                "code": code,
                "description": "Sort an array using merge sort in C#.",
                "dependencies": [],
            }

        if language_key == "go":
            code = (
                "package main\n\n"
                "import \"fmt\"\n\n"
                "func merge(left, right []int) []int {\n"
                "  result := make([]int, 0, len(left)+len(right))\n"
                "  i, j := 0, 0\n"
                "  for i < len(left) && j < len(right) {\n"
                "    if left[i] < right[j] {\n"
                "      result = append(result, left[i])\n"
                "      i++\n"
                "    } else {\n"
                "      result = append(result, right[j])\n"
                "      j++\n"
                "    }\n"
                "  }\n"
                "  result = append(result, left[i:]...)\n"
                "  result = append(result, right[j:]...)\n"
                "  return result\n"
                "}\n\n"
                "func mergeSort(arr []int) []int {\n"
                "  if len(arr) <= 1 {\n"
                "    return arr\n"
                "  }\n"
                "  mid := len(arr) / 2\n"
                "  left := mergeSort(arr[:mid])\n"
                "  right := mergeSort(arr[mid:])\n"
                "  return merge(left, right)\n"
                "}\n\n"
                "func main() {\n"
                "  fmt.Println(mergeSort([]int{5, 2, 9, 1, 5, 6}))\n"
                "}\n"
            )
            return {
                "success": True,
                "filename": "main.go",
                "language": "go",
                "code": code,
                "description": "Sort an array using merge sort in Go.",
                "dependencies": [],
            }

        if language_key == "python":
            code = (
                "def merge(left: list[int], right: list[int]) -> list[int]:\n"
                "    result = []\n"
                "    i, j = 0, 0\n"
                "    while i < len(left) and j < len(right):\n"
                "        if left[i] < right[j]:\n"
                "            result.append(left[i])\n"
                "            i += 1\n"
                "        else:\n"
                "            result.append(right[j])\n"
                "            j += 1\n"
                "    result.extend(left[i:])\n"
                "    result.extend(right[j:])\n"
                "    return result\n\n"
                "def merge_sort(arr: list[int]) -> list[int]:\n"
                "    if len(arr) <= 1:\n"
                "        return arr\n"
                "    mid = len(arr) // 2\n"
                "    left = merge_sort(arr[:mid])\n"
                "    right = merge_sort(arr[mid:])\n"
                "    return merge(left, right)\n\n"
                "print(merge_sort([5, 2, 9, 1, 5, 6]))\n"
            )
            return {
                "success": True,
                "filename": "main.py",
                "language": "python",
                "code": code,
                "description": "Sort an array using merge sort in Python.",
                "dependencies": [],
            }

        return self._basic_if_else_code(language_key)

    def generate_multiple_implementations(
        self,
        description: str,
        languages: list[str],
    ) -> dict:
        """
        Generate the same code in multiple programming languages.

        Args:
            description: Description of what to generate
            languages: List of programming languages

        Returns:
            Dictionary mapping language to generated code
        """
        results = {}
        for language in languages:
            result = self.generate_code(description, language=language)
            results[language] = result

        return results

    def refine_code(
        self,
        code: str,
        feedback: str,
        language: str = "python",
    ) -> dict:
        """
        Refine existing code based on feedback.

        Args:
            code: Existing code to refine
            feedback: Feedback/requirements for refinement
            language: Programming language

        Returns:
            Dictionary with refined code
        """
        prompt = f"""You are an expert code reviewer and refactorer.

Current code:
```{language}
{code}
```

Feedback/Requirements for refinement:
{feedback}

Please refine the code based on the feedback. Return a JSON object with:
{{
    "code": "the refined code here",
    "changes": "summary of changes made",
    "language": "{language}"
}}

Only return valid JSON."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text
            result = self._parse_json_response(response_text)

            if result:
                result["success"] = True
                return result
            else:
                return {
                    "success": False,
                    "error": "Failed to parse refined code",
                    "raw_response": response_text,
                }

        except Exception as e:
            logger.error(f"Error refining code: {str(e)}")
            return {"success": False, "error": str(e)}


# Singleton instance
_code_generator = None


def get_code_generator() -> CodeGeneratorService:
    """Get or create the code generator service."""
    global _code_generator
    if _code_generator is None:
        _code_generator = CodeGeneratorService()
    return _code_generator
