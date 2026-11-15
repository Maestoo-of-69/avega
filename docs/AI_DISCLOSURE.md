# AI disclosure

AVEGA is developed with the help of an AI assistant (Claude, by Anthropic), used through Claude Code / claude.ai.

**Where AI was used**
- Writing and refactoring code (single-file HTML prototype, synthetic-data generator).
- Drafting interface texts and translations (Russian / English).
- Reading public NASA pages and summarising them into `docs/REFERENCES.md`.

**Where AI was not used**
- No real astronaut or patient data was given to, or produced by, an AI. All data in this repository is synthetic.
- No medical advice is produced; recommendations in the UI are placeholders.

**The in-app chat is not an AI model**
The chat in Personal Support (`prototype/chat.js`) is not a language model and does not call any AI service. It matches keywords in the user's question and returns text that already exists in the on-board handbook (`KB`), the action table (`RECS`) or the fixed safety texts of `docs/CHAT_SPEC.md`, plus this person's own numbers from `assess()` and `engine()`. It cannot write new sentences; when nothing matches it says that the database has no answer. AI (Claude) was used only to write the code of the chat, not to produce its answers.

**Human responsibility**
- The team decides the product direction and reviews everything before submission; AI output is checked against sources listed in `docs/REFERENCES.md`.
- Where a source does not say something, the project states that instead of filling the gap (see "Does not say" entries).

*Update this file if other AI tools are added (e.g. a recommendation engine).*
