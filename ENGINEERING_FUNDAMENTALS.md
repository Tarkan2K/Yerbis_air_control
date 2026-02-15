# Engineering Fundamentals: From Syntax to Systems

**Author:** Antigravity AI
**Purpose:** A comprehensive guide to the computer science principles and JavaScript mechanics powering Yerbis Air Control.

---

# Part I: JavaScript Primer

## 1. Variables and Storage
*   **`const`**: Immutable reference. Use by default for values that should not be reassigned.
*   **`let`**: Mutable binding. Use only when reassignment is explicitly required (e.g., counters, acumulators).
*   **`var`**: Deprecated. Avoid usage due to function-scoping and hoisting issues.

## 2. Functions
Functions are first-class citizens in JavaScript.
*   **Arrow Functions (`=>`)**: concise syntax with lexical `this` binding.
    *   Example: `const sum = (a, b) => a + b;`
*   **Standard Functions**: Usage recommended when dynamic `this` context is required or for generator functions.

## 3. Data Structures
*   **Objects**: Key-value pairs for structured data.
*   **Arrays**: Ordered lists. Modern operations prefer functional methods (`map`, `filter`, `reduce`) over imperative loops (`for`) for immutability and readability.

---

# Part II: Engineering Modern JavaScript

## 1. Async Programming
JavaScript uses an asynchronous, non-blocking model suitable for I/O operations.

### The Event Loop
The mechanism that allows JavaScript to perform non-blocking operations.
1.  **Call Stack**: Executes synchronous code.
2.  **Web APIs**: Handles background tasks (Timers, Fetch).
3.  **Callback Queue**: Holds callbacks ready for execution.
4.  **Loop**: Moves tasks from the Queue to the Stack when the Stack is empty.

### Async/Await
Syntactic sugar over Promises that allows writing asynchronous code in a synchronous style.
*   **`async`**: Declares that a function returns a Promise.
*   **`await`**: Pauses function execution until the Promise resolves.
*   **Application**: Yerbis uses `await` to handle Gemini API latency without blocking the UI thread.

## 2. DOM Manipulation
The Document Object Model (DOM) is the interface between JavaScript and the rendered page.
*   **Selection**: `document.querySelector` provides precise element targeting.
*   **Events**: `addEventListener` enables reactive behavior to user inputs.
*   **Performance**: Minimize DOM writes to avoid "Layout Thrashing" (forced synchronous reflows).

---

# Part III: Advanced System Architecture

## 1. Memory Management (V8 Engine)
Understanding memory allocation prevents leaks and performance degradation.
*   **Stack**: Stores primitives and execution contexts. Fast allocation/deallocation.
*   **Heap**: Stores objects and closures. Slower, managed by the Garbage Collector (GC).
*   **Garbage Collection**: V8 uses a generational GC (Orinoco). Short-lived objects (like vector coordinates in a render loop) die in the "Nursery" (New Space), while persistent objects move to Old Space.

## 2. Closures and Scope
A closure gives a function access to its outer scope, even after the outer function has returned.
*   **Mechanism**: Functions retain a reference to their creation environment.
*   **Application**: Essential for React `useEffect` hooks and event handlers that need access to state.
*   **Risk**: Improper use can lead to memory leaks if references to large objects are unintentionally retained.

## 3. IEEE 754 Floating Point
JavaScript uses 64-bit floating-point numbers for all numeric values.
*   **Precision Issues**: `0.1 + 0.2 !== 0.3`.
*   **Engineering Solution**: Use an epsilon (small margin of error) when comparing floating-point numbers, especially for video time tracking.

---

# Part IV: Artificial Intelligence Theory

## 1. Large Language Models (LLMs)
*   **Tokenization**: Converting text into numerical tokens.
*   **Embeddings**: Representing tokens as vectors in high-dimensional space where geometric proximity indicates semantic similarity.
*   **Attention Mechanism**: Allows the model to weigh the relevance of different parts of the input sequence regardless of distance.

## 2. Computer Vision (Convolutional Neural Networks)
*   **Tensors**: Multi-dimensional arrays representing image data (Height x Width x Channels).
*   **Convolutions**: Mathematical operations (filters) that extract features like edges, shapes, and textures.
*   **MediaPipe Architecture**: Uses a two-step pipeline (Palm Detection -> Landmark Regression) to achieve real-time hand tracking on CPU.
