"""
==========================================================================
AI ADMIN ASSISTANT - EXECUTIVE BACKEND API SERVER
Zero-Dependency Python 3.14 Server for AI Actions, Tasks, & Metrics
==========================================================================
"""

import http.server
import socketserver
import json
import urllib.parse
import time
import os
import html

PORT = 3000

def sanitize_input(text, max_len=500):
    if not isinstance(text, str):
        return ""
    cleaned = html.escape(text.strip())
    return cleaned[:max_len]

# In-Memory Database State
DB = {
    "tasks": [
        {
            "id": "task-101",
            "title": "Executive Email Triage & Draft Replies",
            "category": "Communication",
            "progress": 100,
            "status": "Completed",
            "agent": "Agent #402",
            "desc": "42 emails processed • 5 priority replies drafted."
        },
        {
            "id": "task-102",
            "title": "Q3 Software Expense Reconciliation",
            "category": "Finance AI",
            "progress": 65,
            "status": "Processing",
            "agent": "Agent #819",
            "desc": "Processing 18 pending PDF invoices. Matching bank statements."
        },
        {
            "id": "task-103",
            "title": "Wire Transfer Approval Request ($12,450)",
            "category": "Security",
            "progress": 90,
            "status": "Approval Needed",
            "agent": "Agent #901",
            "desc": "Recipient: Cloud Infrastructure Inc. Verified against Q3 PO #8891."
        },
        {
            "id": "task-104",
            "title": "Nightly Infrastructure Audit",
            "category": "Security",
            "progress": 0,
            "status": "Scheduled",
            "agent": "Agent #901",
            "desc": "Scheduled for 02:00 AM • Automated compliance scan."
        }
    ],
    "activity_feed": [
        {
            "id": "act-1",
            "icon": "✉️",
            "title": "Drafted 6 Executive Responses for Board Prep",
            "desc": "Agent #402 • Verified calendar availability and attached briefing docs.",
            "time": "09:42:15 AM"
        },
        {
            "id": "act-2",
            "icon": "📅",
            "title": "Resolved Overlapping Meeting Conflict",
            "desc": "Agent #219 • Moved Product Sync from 2:00 PM to Friday 10:00 AM.",
            "time": "09:38:00 AM"
        },
        {
            "id": "act-3",
            "icon": "💳",
            "title": "Reconciled $4,280.50 Q3 Travel Expense Receipts",
            "desc": "Agent #819 • Auto-tagged 18 receipts and verified tax eligibility.",
            "time": "09:15:30 AM"
        }
    ],
    "metrics": {
        "hours_saved": 142.5,
        "automated_tasks": 1840,
        "pending_approvals": 3,
        "system_health": "99.8%"
    },
    "reminders": [
        {
            "id": "rem-1",
            "title": "Review Q3 Tax Compliance Draft before 5:00 PM",
            "time": "05:00 PM Today",
            "category": "Finance",
            "completed": False,
            "ai_generated": True
        },
        {
            "id": "rem-2",
            "title": "Call VP Operations regarding Q4 hiring budget",
            "time": "02:30 PM Today",
            "category": "HR & Exec",
            "completed": False,
            "ai_generated": False
        },
        {
            "id": "rem-3",
            "title": "Approve Cloud Infrastructure Invoice ($12,450)",
            "time": "Tomorrow 10:00 AM",
            "category": "Security",
            "completed": True,
            "ai_generated": True
        }
    ],
    "notes": [
        {
            "id": "note-1",
            "title": "Board Strategy Executive Summary",
            "content": "Focus Q4 expansion on autonomous AI workflows. Target 40% reduction in manual admin overhead.",
            "tag": "Strategy",
            "updated": "10m ago"
        },
        {
            "id": "note-2",
            "title": "Vendor Contract Negotiation Terms",
            "content": "Ensure all SaaS vendor contracts include zero data retention clauses for LLM training.",
            "tag": "Legal",
            "updated": "2h ago"
        }
    ],
    "notifications": [
        {
            "id": "notif-1",
            "title": "Wire Transfer Request ($12,450)",
            "desc": "Approval needed for Cloud Infrastructure Inc PO #8891.",
            "category": "Approval Needed",
            "badge": "badge-rose",
            "time": "12m ago",
            "read": False,
            "tab": "tasks"
        },
        {
            "id": "notif-2",
            "title": "Calendar Overlap Resolved",
            "desc": "Product Architecture Sync moved to Friday 10:00 AM.",
            "category": "Calendar",
            "badge": "badge-emerald",
            "time": "35m ago",
            "read": False,
            "tab": "calendar"
        },
        {
            "id": "notif-3",
            "title": "Q3 Expense Receipts Audited",
            "desc": "Agent #819 reconciled 18 pending PDF receipts.",
            "category": "Finance AI",
            "badge": "badge-cyan",
            "time": "1h ago",
            "read": False,
            "tab": "documents"
        }
    ]
}

class ExecutiveAPIHandler(http.server.SimpleHTTPRequestHandler):
    
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-XSS-Protection", "1; mode=block")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()

    def do_GET(self):
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            path = parsed_path.path

            if path == "/api/tasks":
                self._send_json({"success": True, "tasks": DB["tasks"]})
            elif path == "/api/metrics":
                self._send_json({"success": True, "metrics": DB["metrics"], "activity": DB["activity_feed"]})
            elif path == "/api/reminders":
                self._send_json({"success": True, "reminders": DB["reminders"]})
            elif path == "/api/notes":
                self._send_json({"success": True, "notes": DB["notes"]})
            elif path == "/api/notifications":
                self._send_json({"success": True, "notifications": DB["notifications"]})
            elif path == "/api/schedule":
                self._send_json({
                    "success": True,
                    "events": [
                        {"time": "10:00 AM - 11:00 AM", "title": "Q3 Board Strategy Briefing", "status": "Ready"},
                        {"time": "02:30 PM - 03:15 PM", "title": "Product Architecture Review", "status": "Rescheduled"}
                    ]
                })
            else:
                super().do_GET()
        except Exception as err:
            self._send_json({"success": False, "error": f"Internal Server Error: {str(err)}"}, status=500)

    def do_POST(self):
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            path = parsed_path.path

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 100 * 1024:
                return self._send_json({"success": False, "error": "Payload size exceeds limit (100KB)"}, status=413)

            body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
            
            payload = {}
            if content_length > 0:
                try:
                    payload = json.loads(body_bytes.decode('utf-8'))
                except Exception:
                    return self._send_json({"success": False, "error": "Malformed JSON request body"}, status=400)

            if path == "/api/chat":
                prompt = payload.get("prompt")
                if not prompt or not isinstance(prompt, str) or not prompt.strip():
                    return self._send_json({"success": False, "error": "Field 'prompt' must be a non-empty string"}, status=400)

                clean_prompt = sanitize_input(prompt, 1000)
                model = sanitize_input(payload.get("model", "Gemini 3.6 Pro"), 50)
                lower = clean_prompt.lower()

                if "email" in lower or "inbox" in lower or "summarize" in lower:
                    response_text = (
                        "<strong>[Backend API Agent Response]:</strong><br>"
                        "• Scanned 42 unread executive emails.<br>"
                        "• <span class='badge badge-rose'>High Priority</span> 1 urgent approval from VP Operations.<br>"
                        "• Drafted responses for 5 scheduling inquiries."
                    )
                elif "calendar" in lower or "schedule" in lower or "conflict" in lower:
                    response_text = (
                        "<strong>[Backend API Agent Response]:</strong><br>"
                        "• Resolved calendar overlap for Thursday 2:00 PM.<br>"
                        "• Moved Product Sync to Friday 10:00 AM.<br>"
                        "• Updated calendar invites dispatched."
                    )
                elif "expense" in lower or "report" in lower or "audit" in lower:
                    response_text = (
                        "<strong>[Backend API Agent Response]:</strong><br>"
                        "• Audited 18 PDF expense receipts totaling <code>$4,280.50</code>.<br>"
                        "• Auto-categorized Travel (45%) & Subscriptions (35%).<br>"
                        "• Queued for CFO authorization."
                    )
                else:
                    response_text = (
                        f"<strong>[Backend API Engine ({model})]:</strong><br>"
                        f"Successfully processed prompt: <code>\"{clean_prompt}\"</code>.<br>"
                        "Agent background sub-routine executed across 4 vector databases."
                    )

                new_activity = {
                    "id": f"act-{len(DB['activity_feed'])+1}",
                    "icon": "🤖",
                    "title": f"Executed AI Query: {clean_prompt[:30]}...",
                    "desc": f"Engine: {model} • Completed in 120ms",
                    "time": time.strftime("%I:%M:%S %p")
                }
                DB["activity_feed"].insert(0, new_activity)

                self._send_json({
                    "success": True,
                    "model": model,
                    "response": response_text,
                    "latency_ms": 120,
                    "tokens": len(clean_prompt.split()) * 4 + 48
                })

            elif path == "/api/tasks/create":
                title = payload.get("title")
                if not title or not isinstance(title, str) or not title.strip():
                    return self._send_json({"success": False, "error": "Field 'title' is required and must be a valid string"}, status=400)

                clean_title = sanitize_input(title, 200)
                clean_cat = sanitize_input(payload.get("category", "General"), 50)
                clean_agent = sanitize_input(payload.get("agent", "Agent #819"), 50)

                new_task = {
                    "id": f"task-{len(DB['tasks'])+101}",
                    "title": clean_title,
                    "category": clean_cat,
                    "progress": 15,
                    "status": "Processing",
                    "agent": clean_agent.split()[0],
                    "desc": "Just dispatched via Backend API endpoint."
                }
                DB["tasks"].append(new_task)
                self._send_json({"success": True, "task": new_task})

            elif path == "/api/reminders/create":
                title = payload.get("title")
                if not title or not isinstance(title, str) or not title.strip():
                    return self._send_json({"success": False, "error": "Field 'title' is required"}, status=400)

                clean_title = sanitize_input(title, 200)
                clean_cat = sanitize_input(payload.get("category", "General"), 50)
                new_rem = {
                    "id": f"rem-{len(DB['reminders'])+1}",
                    "title": clean_title,
                    "time": sanitize_input(payload.get("time", "Today"), 50),
                    "category": clean_cat,
                    "completed": False,
                    "ai_generated": False
                }
                DB["reminders"].insert(0, new_rem)
                self._send_json({"success": True, "reminder": new_rem})

            elif path == "/api/notes/create":
                title = payload.get("title")
                content = payload.get("content")
                if not title or not isinstance(title, str) or not title.strip():
                    return self._send_json({"success": False, "error": "Field 'title' is required"}, status=400)
                if not content or not isinstance(content, str) or not content.strip():
                    return self._send_json({"success": False, "error": "Field 'content' is required"}, status=400)

                clean_title = sanitize_input(title, 200)
                clean_content = sanitize_input(content, 2000)
                clean_tag = sanitize_input(payload.get("tag", "Strategy"), 50)

                new_note = {
                    "id": f"note-{len(DB['notes'])+1}",
                    "title": clean_title,
                    "content": clean_content,
                    "tag": clean_tag,
                    "updated": "Just now"
                }
                DB["notes"].insert(0, new_note)
                self._send_json({"success": True, "note": new_note})

            elif path == "/api/tasks/action":
                task_id = payload.get("task_id")
                action = payload.get("action")
                if not task_id or action not in ["approve", "decline", "pause"]:
                    return self._send_json({"success": False, "error": "Invalid or missing task_id or action parameter"}, status=400)

                for t in DB["tasks"]:
                    if t["id"] == task_id:
                        if action == "approve": t["status"] = "Completed"
                        elif action == "decline": t["status"] = "Declined"
                        elif action == "pause": t["status"] = "Paused"
                        break
                self._send_json({"success": True, "task_id": task_id, "action": action})

            elif path == "/api/auth/login":
                email = payload.get("email", "").strip()
                if not email or "@" not in email:
                    return self._send_json({"success": False, "error": "A valid email address is required"}, status=400)

                clean_email = sanitize_input(email, 100)
                self._send_json({
                    "success": True,
                    "token": "exec_jwt_token_99283741",
                    "user": {
                        "email": clean_email,
                        "name": "Nayyar Admin",
                        "role": "Chief Executive Officer"
                    }
                })

            elif path == "/api/notifications/read":
                for n in DB["notifications"]:
                    n["read"] = True
                self._send_json({"success": True, "message": "All notifications marked as read"})

            elif path == "/api/search":
                q = sanitize_input(payload.get("query", ""), 100).lower()
                results = []

                # 1. System Actions & Macros
                macros = [
                    {"title": "Summarize Priority Inbox Emails", "desc": "Execute AI email triage & generate executive summary", "cat": "Macro", "badge": "badge-indigo", "tab": "email-assistant", "icon": "✉️"},
                    {"title": "Reconcile Q3 Expense Receipts", "desc": "Scan pending PDF receipts & match bank records", "cat": "Macro", "badge": "badge-cyan", "tab": "documents", "icon": "💳"},
                    {"title": "Optimize Calendar Conflicts", "desc": "Auto-reschedule overlapping meetings by priority", "cat": "Macro", "badge": "badge-emerald", "tab": "calendar", "icon": "📅"},
                    {"title": "Generate Weekly Executive Report", "desc": "Compile team KPIs, revenue metrics, and blockers", "cat": "Macro", "badge": "badge-amber", "tab": "dashboard", "icon": "📊"}
                ]

                for m in macros:
                    if not q or q in m["title"].lower() or q in m["desc"].lower():
                        results.append(m)

                # 2. Tasks
                for t in DB["tasks"]:
                    if not q or q in t["title"].lower() or q in t["desc"].lower() or q in t["category"].lower():
                        results.append({
                            "title": t["title"],
                            "desc": f"Agent: {t['agent']} • Status: {t['status']} • {t['desc']}",
                            "cat": "Task",
                            "badge": "badge-indigo",
                            "tab": "tasks",
                            "icon": "⚡"
                        })

                # 3. Documents
                docs = [
                    {"title": "Q3_Financial_Briefing_v2.pdf", "desc": "Financial statement • Net Revenue +14.2% • OCR Processed", "cat": "Document", "badge": "badge-cyan", "tab": "documents", "icon": "📄"},
                    {"title": "Vendor_Master_Service_Agreement.docx", "desc": "Legal Contract • IP Indemnification • AI Audited", "cat": "Document", "badge": "badge-emerald", "tab": "documents", "icon": "📜"},
                    {"title": "Cloud_Infrastructure_PO_8891.pdf", "desc": "Expense Invoice • $12,450.00 • Pending Sign-off", "cat": "Document", "badge": "badge-rose", "tab": "documents", "icon": "💳"}
                ]
                for d in docs:
                    if not q or q in d["title"].lower() or q in d["desc"].lower():
                        results.append(d)

                # 4. Calendar Events
                cal_events = [
                    {"title": "Q3 Board Strategy Briefing", "desc": "Today 10:00 AM - 11:00 AM • Executive Boardroom A", "cat": "Calendar", "badge": "badge-emerald", "tab": "calendar", "icon": "📅"},
                    {"title": "Product Architecture Review", "desc": "Friday 10:00 AM - 10:45 AM • Rescheduled by AI Agent", "cat": "Calendar", "badge": "badge-indigo", "tab": "calendar", "icon": "🗓️"}
                ]
                for c in cal_events:
                    if not q or q in c["title"].lower() or q in c["desc"].lower():
                        results.append(c)

                # 5. Notes & Reminders
                for n in DB["notes"]:
                    if not q or q in n["title"].lower() or q in n["content"].lower():
                        results.append({
                            "title": n["title"],
                            "desc": f"Note #{n['tag']} • {n['content'][:60]}...",
                            "cat": "Note",
                            "badge": "badge-emerald",
                            "tab": "reminders-notes",
                            "icon": "📝"
                        })

                self._send_json({"success": True, "query": q, "count": len(results), "results": results[:10]})
            else:
                self._send_json({"success": False, "error": "Endpoint not found"}, status=404)
        except Exception as err:
            self._send_json({"success": False, "error": f"Internal Server Error: {str(err)}"}, status=500)

if __name__ == "__main__":
    print(f"AI Executive Backend API & Web Server listening on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), ExecutiveAPIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down gracefully.")
