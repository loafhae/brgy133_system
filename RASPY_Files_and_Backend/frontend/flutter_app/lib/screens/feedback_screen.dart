import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/feedback_provider.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _subjectCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Submission'),
        content: const Text('Are you sure you want to submit this feedback?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('NO')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final fp = context.read<FeedbackProvider>();
              final ok = await fp.submitFeedback(_subjectCtrl.text, _contentCtrl.text);
              if (!mounted) return;
              if (ok) {
                _subjectCtrl.clear();
                _contentCtrl.clear();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Feedback Submitted Successfully!')),
                );
              }
            },
            child: const Text('YES'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Send Feedback')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Consumer<FeedbackProvider>(
                builder: (_, fp, _) {
                  if (fp.error == null) return const SizedBox.shrink();
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(8)),
                    child: Text(fp.error!, style: const TextStyle(color: Colors.red)),
                  );
                },
              ),

              const Text('Subject', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _subjectCtrl,
                decoration: const InputDecoration(
                  hintText: 'e.g. Noise, Garbage, Water',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              const Text('Message', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _contentCtrl,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'Describe your concern...',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('File upload coming soon')),
                      );
                    },
                    icon: const Icon(Icons.attach_file),
                    label: const Text('Attach a file'),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Consumer<FeedbackProvider>(
                builder: (_, fp, _) => SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: fp.submitting ? null : _submit,
                    child: fp.submitting
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('SUBMIT', style: TextStyle(fontSize: 16)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}