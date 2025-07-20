"""All passing tests for unittest reporter validation."""

import unittest
from typing import List


class TestMathOperations(unittest.TestCase):
    """Test basic math operations."""
    
    def test_addition(self):
        """Test addition operation."""
        self.assertEqual(2 + 2, 4)
        self.assertEqual(10 + 5, 15)
        self.assertEqual(-1 + 1, 0)
    
    def test_subtraction(self):
        """Test subtraction operation."""
        self.assertEqual(10 - 5, 5)
        self.assertEqual(0 - 1, -1)
        self.assertEqual(100 - 50, 50)
    
    def test_multiplication(self):
        """Test multiplication operation."""
        self.assertEqual(3 * 4, 12)
        self.assertEqual(0 * 100, 0)
        self.assertEqual(-2 * 3, -6)
    
    def test_division(self):
        """Test division operation."""
        self.assertEqual(10 / 2, 5)
        self.assertEqual(100 / 10, 10)
        self.assertEqual(7 / 2, 3.5)


class TestStringOperations(unittest.TestCase):
    """Test string operations."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_string = "Hello World"
        self.empty_string = ""
    
    def test_concatenation(self):
        """Test string concatenation."""
        self.assertEqual("Hello" + " " + "World", "Hello World")
        self.assertEqual("Python" + "3", "Python3")
        self.assertEqual(self.empty_string + "test", "test")
    
    def test_string_methods(self):
        """Test string methods."""
        self.assertEqual("hello".upper(), "HELLO")
        self.assertEqual("WORLD".lower(), "world")
        self.assertEqual("  space  ".strip(), "space")
        self.assertEqual(self.test_string.lower(), "hello world")
    
    def test_string_formatting(self):
        """Test string formatting."""
        self.assertEqual(f"Value: {42}", "Value: 42")
        self.assertEqual("{} {}".format("Hello", "World"), "Hello World")
        self.assertEqual("%s %d" % ("Count", 10), "Count 10")
    
    def tearDown(self):
        """Clean up after tests."""
        # Nothing to clean up in this case
        pass


class TestListOperations(unittest.TestCase):
    """Test list operations."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.sample_list = [1, 2, 3, 4, 5]
        self.empty_list = []
    
    def test_list_append(self):
        """Test list append operation."""
        original_length = len(self.sample_list)
        self.sample_list.append(6)
        self.assertEqual(len(self.sample_list), original_length + 1)
        self.assertEqual(self.sample_list[-1], 6)
    
    def test_list_remove(self):
        """Test list remove operation."""
        self.sample_list.remove(3)
        self.assertNotIn(3, self.sample_list)
        self.assertEqual(len(self.sample_list), 4)
    
    def test_list_comprehension(self):
        """Test list comprehension."""
        squares = [x**2 for x in range(5)]
        self.assertEqual(squares, [0, 1, 4, 9, 16])
        
        evens = [x for x in self.sample_list if x % 2 == 0]
        self.assertEqual(evens, [2, 4])
    
    def test_list_operations(self):
        """Test various list operations."""
        self.assertEqual(sum(self.sample_list), 15)
        self.assertEqual(max(self.sample_list), 5)
        self.assertEqual(min(self.sample_list), 1)
        self.assertEqual(sorted([3, 1, 4, 1, 5]), [1, 1, 3, 4, 5])


class TestDictionaryOperations(unittest.TestCase):
    """Test dictionary operations."""
    
    def test_dictionary_creation(self):
        """Test dictionary creation and access."""
        data = {"name": "John", "age": 30}
        self.assertEqual(data["name"], "John")
        self.assertEqual(data.get("age"), 30)
        self.assertEqual(data.get("city", "Unknown"), "Unknown")
    
    def test_dictionary_modification(self):
        """Test dictionary modification."""
        data = {"count": 0}
        data["count"] += 1
        self.assertEqual(data["count"], 1)
        
        data["new_key"] = "new_value"
        self.assertIn("new_key", data)
        self.assertEqual(len(data), 2)
    
    def test_dictionary_methods(self):
        """Test dictionary methods."""
        data = {"a": 1, "b": 2, "c": 3}
        self.assertEqual(list(data.keys()), ["a", "b", "c"])
        self.assertEqual(list(data.values()), [1, 2, 3])
        self.assertEqual(len(data.items()), 3)


class TestBooleanLogic(unittest.TestCase):
    """Test boolean logic and assertions."""
    
    def test_true_assertions(self):
        """Test assertTrue assertions."""
        self.assertTrue(True)
        self.assertTrue(1 == 1)
        self.assertTrue("hello" in "hello world")
        self.assertTrue(len([1, 2, 3]) > 0)
    
    def test_false_assertions(self):
        """Test assertFalse assertions."""
        self.assertFalse(False)
        self.assertFalse(1 == 2)
        self.assertFalse("goodbye" in "hello world")
        self.assertFalse(len([]) > 0)
    
    def test_is_assertions(self):
        """Test assertIs and assertIsNot."""
        a = [1, 2, 3]
        b = a
        c = [1, 2, 3]
        
        self.assertIs(a, b)
        self.assertIsNot(a, c)
        self.assertIsNone(None)
        self.assertIsNotNone("something")
    
    def test_in_assertions(self):
        """Test assertIn and assertNotIn."""
        items = ["apple", "banana", "orange"]
        self.assertIn("banana", items)
        self.assertNotIn("grape", items)
        
        text = "The quick brown fox"
        self.assertIn("quick", text)
        self.assertNotIn("slow", text)


class TestNumericComparisons(unittest.TestCase):
    """Test numeric comparison assertions."""
    
    def test_equality(self):
        """Test equality assertions."""
        self.assertEqual(5, 5)
        self.assertNotEqual(5, 6)
        self.assertAlmostEqual(0.1 + 0.2, 0.3, places=10)
        self.assertNotAlmostEqual(0.1, 0.2, places=1)
    
    def test_comparisons(self):
        """Test comparison assertions."""
        self.assertGreater(10, 5)
        self.assertGreaterEqual(10, 10)
        self.assertLess(5, 10)
        self.assertLessEqual(5, 5)
    
    def test_ranges(self):
        """Test range validations."""
        value = 7
        self.assertTrue(5 <= value <= 10)
        self.assertFalse(value < 5 or value > 10)
        
        # Custom range check
        def in_range(x, low, high):
            return low <= x <= high
        
        self.assertTrue(in_range(7, 5, 10))
        self.assertFalse(in_range(11, 5, 10))


if __name__ == '__main__':
    unittest.main()