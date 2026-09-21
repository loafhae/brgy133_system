import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/announcement_provider.dart';
import '../widgets/resident_app_scaffold.dart';

/// AnnouncementsScreen - Mobile Announcements List Interface.
/// Strictly adheres to Figures 4.1.6 & 4.1.7 in documentation.pdf.
class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  static const Color _primaryRed = Color(0xFF990000);

  final _searchCtrl = TextEditingController();
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Ayuda & Assistance',
    'Utility Advisories',
    'Sanitation & Garbage',
    'Health & Safety',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnnouncementProvider>().fetchAnnouncements();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  String _formatDate(dynamic date) {
    if (date == null) return '';
    return date.toString();
  }

  Color _getCategoryColor(String title, String content) {
    final text = '$title $content'.toLowerCase();
    if (text.contains('ayuda') || text.contains('senior') || text.contains('financial')) {
      return const Color(0xFF16A34A); // Green
    }
    if (text.contains('power') || text.contains('water') || text.contains('outage') || text.contains('interruption')) {
      return const Color(0xFFD97706); // Amber
    }
    if (text.contains('garbage') || text.contains('waste') || text.contains('collection')) {
      return const Color(0xFFDC2626); // Red
    }
    return const Color(0xFF2563EB); // Blue
  }

  String _inferCategory(String title, String content) {
    final text = '$title $content'.toLowerCase();
    if (text.contains('ayuda') || text.contains('senior') || text.contains('assistance')) {
      return 'Ayuda & Assistance';
    }
    if (text.contains('power') || text.contains('water') || text.contains('outage') || text.contains('interruption')) {
      return 'Utility Advisories';
    }
    if (text.contains('garbage') || text.contains('waste') || text.contains('sanitation')) {
      return 'Sanitation & Garbage';
    }
    if (text.contains('health') || text.contains('vaccine') || text.contains('safety')) {
      return 'Health & Safety';
    }
    return 'General Announcement';
  }

  @override
  Widget build(BuildContext context) {
    return ResidentAppScaffold(
      currentRoute: '/announcements',
      body: Column(
        children: [
          // 1. Search Bar (Figure 4.1.7)
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search Announcements...',
                hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF71717A)),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF71717A), size: 20),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF71717A)),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() {});
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _primaryRed, width: 1.5),
                ),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),

          // 2. "Filter by" Category Chips (Figure 4.1.7)
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      selectedColor: _primaryRed,
                      backgroundColor: const Color(0xFFF1F5F9),
                      labelStyle: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : const Color(0xFF475569),
                      ),
                      side: BorderSide(
                        color: isSelected ? _primaryRed : const Color(0xFFE2E8F0),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // 3. Announcements Stacked Feed (Figures 4.1.6 & 4.1.7)
          Expanded(
            child: Consumer<AnnouncementProvider>(
              builder: (_, ap, _) {
                if (ap.loading) {
                  return const Center(
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: _primaryRed),
                  );
                }

                if (ap.error != null) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline_rounded, size: 40, color: Color(0xFFDC2626)),
                          const SizedBox(height: 12),
                          Text('Failed to load announcements: ${ap.error}', textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => ap.fetchAnnouncements(),
                            child: const Text('Try Again'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final safeList = ap.announcements;

                final query = _searchCtrl.text.trim().toLowerCase();
                final filtered = safeList.where((a) {
                  final titleMatch = a.title.toLowerCase().contains(query);
                  final contentMatch = a.content.toLowerCase().contains(query);
                  final matchesSearch = query.isEmpty || titleMatch || contentMatch;

                  if (!matchesSearch) return false;

                  if (_selectedCategory == 'All') return true;
                  final cat = _inferCategory(a.title, a.content);
                  return cat == _selectedCategory;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.search_off_rounded, size: 48, color: Color(0xFFA1A1AA)),
                          const SizedBox(height: 12),
                          const Text(
                            'No matching announcements found.',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF52525B)),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Try selecting another category or clearing your search keywords.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Color(0xFF71717A)),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  color: _primaryRed,
                  onRefresh: () => ap.fetchAnnouncements(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final a = filtered[i];
                      final catLabel = _inferCategory(a.title, a.content);
                      final catColor = _getCategoryColor(a.title, a.content);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: catColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    catLabel,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: catColor,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ),
                                if (a.datePosted != null)
                                  Row(
                                    children: [
                                      const Icon(Icons.access_time_rounded, size: 12, color: Color(0xFF71717A)),
                                      const SizedBox(width: 4),
                                      Text(
                                        _formatDate(a.datePosted),
                                        style: const TextStyle(fontSize: 11, color: Color(0xFF71717A), fontWeight: FontWeight.w500),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              a.title,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF18181B),
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              a.content,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF52525B),
                                height: 1.45,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                if (a.attachmentPath != null && a.attachmentPath!.isNotEmpty)
                                  const Row(
                                    children: [
                                      Icon(Icons.attach_file_rounded, size: 14, color: Color(0xFF71717A)),
                                      SizedBox(width: 4),
                                      Text('Attachment included', style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                                    ],
                                  )
                                else
                                  const SizedBox.shrink(),
                                ElevatedButton(
                                  onPressed: () => Navigator.pushNamed(context, '/announcement-detail', arguments: a),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _primaryRed,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text('Read More'),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_rounded, size: 14),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}