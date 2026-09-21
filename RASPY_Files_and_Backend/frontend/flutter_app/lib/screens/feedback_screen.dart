import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../providers/feedback_provider.dart';
import '../widgets/confirmation_dialog.dart';
import '../widgets/resident_app_scaffold.dart';

/// FeedbackScreen - Resident Feedback Interface.
/// Strictly adheres to Figure 4.2.1 (3-Stage Sequential Workflow)
/// and Figure 4.2.2 (Feedback Side Menu) in documentation.pdf.
///
/// Stages:
/// Stage 1: Composition Screen (Subject, Message, Attach File, Spam Cooldown)
/// Stage 2: Confirmation Dialog ("Are you sure you want to submit this feedback? [YES] [NO]")
/// Stage 3: Completion Screen ("Feedback Submitted Successfully!")
class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  static const Color _primaryRed = Color(0xFF990000);

  final _subjectCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  String? _attachedFileName;
  bool _isSubmitted = false;
  String _submittedTicketId = '';

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      );

      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _attachedFileName = result.files.first.name;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('File selection was cancelled or not supported.')),
        );
      }
    }
  }

  Future<void> _handleFormSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    // Stage 2: Confirmation Screen / Modal (Figure 4.2.1 Center)
    final confirmed = await ConfirmationDialog.show(
      context,
      title: 'Confirm Feedback Submission',
      message: 'Are you sure you want to submit this feedback to Barangay 133 officials?',
      yesText: 'YES',
      noText: 'NO',
      isDestructive: false,
    );

    if (!confirmed || !mounted) return;

    final fp = context.read<FeedbackProvider>();
    final ok = await fp.submitFeedback(_subjectCtrl.text.trim(), _contentCtrl.text.trim());

    if (!mounted) return;

    if (ok) {
      // Stage 3: Completion Screen (Figure 4.2.1 Right)
      final now = DateTime.now();
      setState(() {
        _isSubmitted = true;
        _submittedTicketId = 'BRGY133-FB-${now.millisecondsSinceEpoch.toString().substring(7)}';
      });
    }
  }

  void _resetForm() {
    setState(() {
      _isSubmitted = false;
      _subjectCtrl.clear();
      _contentCtrl.clear();
      _attachedFileName = null;
      _submittedTicketId = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    return ResidentAppScaffold(
      currentRoute: '/feedback',
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: _isSubmitted ? _buildCompletionScreen() : _buildCompositionScreen(),
      ),
    );
  }

  // STAGE 1: Composition Screen (Figure 4.2.1 Left)
  Widget _buildCompositionScreen() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Notice
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.rate_review_rounded, color: _primaryRed, size: 22),
                SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Direct Official Feedback & Inquiries',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF18181B)),
                      ),
                      Text(
                        'Reports regarding missed waste collections, road hazards, or barangay services are reviewed by officials.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF71717A), height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Error banner if any
          Consumer<FeedbackProvider>(
            builder: (_, fp, _) {
              if (fp.error == null) return const SizedBox.shrink();
              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(fp.error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
                    ),
                  ],
                ),
              );
            },
          ),

          // Form Container
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Subject',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF18181B)),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _subjectCtrl,
                  decoration: InputDecoration(
                    hintText: 'e.g., Uncollected Waste on Rodriguez St., Broken Streetlight',
                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFFA1A1AA)),
                    prefixIcon: const Icon(Icons.title_rounded, size: 18, color: Color(0xFF71717A)),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter a subject' : null,
                ),
                const SizedBox(height: 16),

                const Text(
                  'Message / Narrative Details',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF18181B)),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _contentCtrl,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    hintText: 'Please describe the location, issue, or question clearly so barangay officials can take prompt action...',
                    hintStyle: TextStyle(fontSize: 12, color: Color(0xFFA1A1AA)),
                    alignLabelWithHint: true,
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Please describe your concern' : null,
                ),
                const SizedBox(height: 16),

                // "Attach a file" Utility (Figure 4.2.1)
                const Text(
                  'Digital Evidence (Optional)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF18181B)),
                ),
                const SizedBox(height: 6),
                InkWell(
                  onTap: _pickFile,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _attachedFileName != null ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _attachedFileName != null ? Icons.check_circle_rounded : Icons.attach_file_rounded,
                          color: _attachedFileName != null ? const Color(0xFF16A34A) : const Color(0xFF71717A),
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _attachedFileName ?? 'Attach a file or photo (JPG, PNG, PDF)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _attachedFileName != null ? FontWeight.w700 : FontWeight.w500,
                              color: _attachedFileName != null ? const Color(0xFF16A34A) : const Color(0xFF52525B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (_attachedFileName != null)
                          IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF71717A)),
                            onPressed: () => setState(() => _attachedFileName = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // 5-minute spam cooldown warning
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Notice: To prevent spamming, submissions are subject to a 5-minute cooldown interval.',
                          style: TextStyle(fontSize: 11, color: Color(0xFFB45309), height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // SUBMIT Button (Figure 4.2.1)
                Consumer<FeedbackProvider>(
                  builder: (_, fp, _) => SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: fp.loading ? null : _handleFormSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A), // Green CTA
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      child: fp.loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text(
                              'SUBMIT FEEDBACK',
                              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.8),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // STAGE 3: Completion Screen (Figure 4.2.1 Right)
  Widget _buildCompletionScreen() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFFF0FDF4),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              color: Color(0xFF16A34A),
              size: 56,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Feedback Submitted Successfully!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Color(0xFF18181B),
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Your concern has been securely logged into the Barangay 133 management console. Officials will review your report shortly.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Color(0xFF52525B), height: 1.5),
          ),
          const SizedBox(height: 20),

          // Reference Ticket Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Ticket ID:', style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                    Text(_submittedTicketId, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 6),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Status:', style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                    Text('Pending Official Review', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action CTAs
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _resetForm,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF52525B),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Submit Another', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/dashboard'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryRed,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Back to Dashboard', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}